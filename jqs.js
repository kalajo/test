import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.PreparedStatementCreator;

@Slf4j
public class DatabaseService {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public DatabaseService(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    public int createCheckpointAndUpdate(PreparedStatementCreator psc, int maxRows) {
        try {
            int updateCount = namedParameterJdbcTemplate.getJdbcOperations().update(psc);

            if (updateCount > maxRows) {
                // Exceeding maxRows is an exceptional condition, handle accordingly
                log.error("Update limit of {} exceeded with {} updates.", maxRows, updateCount);
                // Manually trigger a rollback by throwing a runtime exception
                throw new RuntimeException("Update limit exceeded.");
            }

            return updateCount;
        } catch (DataAccessException e) {
            // Log the exception details and rethrow it to trigger transaction rollback
            log.error("DataAccessException occurred during update: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            // Log unexpected exceptions and rethrow as a runtime exception to trigger rollback
            log.error("Unexpected exception occurred during update: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
}