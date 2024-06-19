import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;

@Slf4j
public class DatabaseService {

    @Transactional(rollbackFor = Exception.class)
    public String createCheckpointAndUpdate(JdbcTemplate jdbcTemplate, PreparedStatementCreator psc, int maxRows) throws SQLException {
        return jdbcTemplate.execute((Connection con) -> {
            Savepoint savepoint = con.setSavepoint("SP_" + System.currentTimeMillis()); // Unique savepoint name

            try (PreparedStatement ps = psc.createPreparedStatement(con)) {
                con.setAutoCommit(false);

                int[] updateCounts = ps.executeBatch();

                // Check if update count exceeds the maximum allowed rows
                if (updateCounts.length > maxRows) {
                    throw new SQLException("Update limit exceeded.");
                }

                con.commit();
            } catch (DataIntegrityViolationException e) {
                // Handle specific data integrity violations
                log.error("Data integrity violation: {}", e.getMessage(), e);
                throw e;
            } finally {
                con.setAutoCommit(true);
            }
            return savepoint.getName();
        });
    }

    // Additional method to validate input data before processing
    public boolean validateInputData(YourDataType data) {
        // Implement validation logic here
        // Return true if data is valid, false otherwise
    }
}