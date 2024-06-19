@Transactional(rollbackFor = Exception.class)
@SneakyThrows
public String createCheckpointAndUpdate(PreparedStatementCreator psc, int maxRows) {
    return jdbcTemplate.execute((Connection con) -> {
        try {
            con.setAutoCommit(false); // Ensure auto-commit is off
            Savepoint savepoint = con.setSavepoint("SP_" + System.currentTimeMillis());

            try (PreparedStatement ps = psc.createPreparedStatement(con)) {
                int[] updateCounts = ps.executeBatch();

                if (updateCounts.length > maxRows) {
                    throw new SQLException("Update limit exceeded.");
                }

                con.commit();
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