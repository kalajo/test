import lombok.extern.slf4j.Slf4j;
import lombok.SneakyThrows;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Savepoint;

@Slf4j
public class DatabaseService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    @SneakyThrows // This annotation will allow you to throw checked exceptions without declaring them
    public String createCheckpointAndUpdate(PreparedStatementCreator psc, int maxRows) {
        return jdbcTemplate.execute(psc, (PreparedStatement ps) -> {
            Savepoint savepoint = null;
            try {
                Connection con = ps.getConnection();
                con.setAutoCommit(false);
                savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());

                int[] updateCounts = ps.executeBatch();

                if (updateCounts.length > maxRows) {
                    throw new SQLException("Update limit exceeded.");
                }

                con.commit();
                return savepoint.getSavepointName();
            } catch (SQLException e) {
                log.error("SQLException occurred: {}", e.getMessage(), e);
                if (savepoint != null) {
                    ps.getConnection().rollback(savepoint);
                }
                throw e;
            } finally {
                ps.getConnection