import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;

@Slf4j
public class DatabaseService {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public DatabaseService(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    public String createCheckpointAndUpdate(PreparedStatementCreator psc, int maxRows) throws SQLException {
        return namedParameterJdbcTemplate.getJdbcOperations().execute((Connection con) -> {
            Savepoint savepoint = null;
            try {
                con.setAutoCommit(false); // Turn off auto-commit
                savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());

                try (PreparedStatement ps = psc.createPreparedStatement(con)) {
                    int[] updateCounts = ps.executeBatch();

                    if (updateCounts.length > maxRows) {
                        throw new SQLException("Update limit exceeded.");
                    }

                    con.commit(); // Commit the transaction
                } catch (SQLException e) {
                    log.error("SQLException occurred: {}", e.getMessage(), e);
                    if (savepoint != null) {
                        con.rollback(savepoint); // Rollback to the savepoint
                    }
                    throw e;
                } finally {
                    con.setAutoCommit(true); // Reset auto-commit to true
                }
                return savepoint.getSavepointName();
            } catch (SQLException e) {
                log.error("Error setting auto-commit to false: {}", e.getMessage(), e);
                throw e;
            }
        });
    }
}