import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;

@Slf4j
public class DatabaseService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    public String createCheckpointAndUpdate(PreparedStatementCreator psc, int maxRows) throws SQLException {
        return jdbcTemplate.execute((Connection con) -> {
            Savepoint savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());
            try (PreparedStatement ps = psc.createPreparedStatement(con)) {
                con.setAutoCommit(false);

                int[] updateCounts = ps.executeBatch();

                if (updateCounts.length > maxRows) {
                    throw new SQLException("Update limit exceeded.");
                }

                con.commit();
            } catch (SQLException e) {
                log.error("SQLException occurred: {}", e.getMessage(), e);
                if (savepoint != null) {
                    con.rollback(savepoint);
                }
                throw e;
            } finally {
                if (con != null) {
                    con.setAutoCommit(true);
                }
            }
            return savepoint.getSavepointName();
        });
    }
}