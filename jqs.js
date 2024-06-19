import lombok.extern.slf4j.Slf4j;
import lombok.SneakyThrows;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
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
    @SneakyThrows // This annotation will allow you to throw checked exceptions without declaring them
    public String createCheckpointAndUpdate(SqlParameterSource parameterSource, String sql, int maxRows) {
        return namedParameterJdbcTemplate.getJdbcOperations().execute((Connection con) -> {
            Savepoint savepoint = null;
            try {
                con.setAutoCommit(false);
                savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());

                try (PreparedStatement ps = namedParameterJdbcTemplate.getJdbcOperations().getDataSource().getConnection().prepareStatement(sql)) {
                    int[] updateCounts = ps.executeBatch();

                    if (updateCounts.length > maxRows) {
                        throw new SQLException("Update limit exceeded.");
                    }

                    con.commit();
                } finally {
                    con.setAutoCommit(true);
                }
                return savepoint.getSavepointName();
            } catch (SQLException e) {
                log.error("SQLException occurred: {}", e.getMessage(), e);
                if (savepoint != null) {
                    con.rollback(savepoint);
                }
                throw e;
            }
        });
    }
}