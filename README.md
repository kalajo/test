import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class YourApplication {

    public void updateQueryResult(HashMap<String, Object> paramMap, QueryResult queryResult) {
        // Convert all headers to lower case and store in a HashSet for quick lookup
        Set<String> lowerCaseHeaders = queryResult.getHeaders().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // Convert paramMap keys to lower case and store in a HashSet
        Set<String> lowerCaseParamKeys = paramMap.keySet().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // Find the intersection of headers and param keys
        lowerCaseParamKeys.retainAll(lowerCaseHeaders);

        // If no matching headers, no need to proceed further
        if (lowerCaseParamKeys.isEmpty()) {
            return;
        }

        // Create a map of header to index for quick access
        Map<String, Integer> headerIndexMap = IntStream.range(0, queryResult.getHeaders().size())
                .boxed()
                .collect(Collectors.toMap(i -> queryResult.getHeaders().get(i).toLowerCase(), i -> i));

        // Use parallelStream for processing large data sets
        queryResult.getData().parallelStream().forEach(resultDataRow -> {
            List<String> elements = resultDataRow.getElement();
            lowerCaseParamKeys.forEach(key -> {
                int index = headerIndexMap.get(key);
                String originalValue = elements.get(index);
                elements.set(index, originalValue + "_changed");
            });
        });
    }
}

// QueryResult and ResultDataRow classes remain the same
