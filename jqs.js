import lombok.extern.slf4j.Slf4j;
import lombok.SneakyThrows;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.PreparedStatement;
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
        return jdbcTemplate.execute((Connection con) -> {
            Savepoint savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());
            try (PreparedStatement ps = psc.createPreparedStatement(con)) {
                con.setAutoCommit(false);

                int[] updateCounts = ps.executeBatch();

                if (updateCounts.length > maxRows) {
                    throw new SQLException("Update limit exceeded.");
                }

                con.commit();
            } finally {
                con.setAutoCommit(true);
            }
            return savepoint.getSavepointName();
});
}
}