import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;

public class DatabaseService {

    @Transactional(rollbackFor = Exception.class)
    public String createCheckpointAndUpdate(JdbcTemplate jdbcTemplate, String query, Object[] params) throws SQLException {
        return jdbcTemplate.execute((Connection con) -> {
            Savepoint savepoint = null;
            String savepointName = null;
            try {
                con.setAutoCommit(false); // Disable auto-commit
                savepoint = con.setSavepoint(); // Create a savepoint
                savepointName = savepoint.getSavepointName(); // Get the savepoint name

                // Prepare the statement for batch execution
                PreparedStatement ps = con.prepareStatement(query);
                for (Object param : params) {
                    ps.setObject(1, param);
                    ps.addBatch();
                }

                // Execute batch update
                int[] updateCounts = ps.executeBatch();

                // Check if more than 10 rows are updated
                if (updateCounts.length > 10) {
                    throw new SQLException("Attempted to update more than 10 rows, rolling back transaction.");
                }

                // Commit the transaction if the update is successful
                con.commit();
            } catch (SQLException e) {
                // If there's an error, roll back to the savepoint
                if (savepoint != null) {
                    con.rollback(savepoint);
                }
                throw e; // Rethrow the exception to handle it as needed
            } finally {
                if (con != null) {
                    con.setAutoCommit(true); // Restore auto-commit mode
                }
            }
            return savepointName; // Return the savepoint name for future reference
        });
    }
}