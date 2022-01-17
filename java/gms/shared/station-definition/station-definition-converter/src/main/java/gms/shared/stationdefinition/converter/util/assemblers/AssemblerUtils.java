package gms.shared.stationdefinition.converter.util.assemblers;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.Table;
import com.google.common.collect.TreeRangeMap;

import java.time.Instant;
import java.util.Collection;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collector;

public class AssemblerUtils {

  private AssemblerUtils(){}

  /**
   * Builds a table of version for a provided  collection of objects
   * @param rowKeyExtractor A function that extracts the first key (row key) from the object to be versioned
   * @param columnKeyExtractor A function that extracts the second key (column key) from the object to be versioned
   * @param versionKeyExtractor A function that extracts the key that defines the version of the object
   * @param versions The objects to be versioned
   * @param <R> The type of the row key
   * @param <C> The type of the column key
   * @param <V> The type of object to be versioned
   * @return A table of versions of object, based on row and column keys
   */
  public static <R, C, V> Table<R, C, RangeMap<Instant, V>> buildVersionRangeTable(Function<V, R> rowKeyExtractor,
    Function<V, C> columnKeyExtractor,
    Function<V, Instant> versionKeyExtractor,
    Function<V, Instant> versionOffDateExtractor,
    Collection<V> versions) {

    return versions.stream()
      .collect(Collector.of(HashBasedTable::create,
        (table, version) -> {
          var rowKey = rowKeyExtractor.apply(version);
          var columnKey = columnKeyExtractor.apply(version);
          if (!table.contains(rowKey, columnKey)) {
            table.put(rowKey, columnKey, TreeRangeMap.create());
          }

          table.get(rowKey, columnKey).put(Range.closed(versionKeyExtractor.apply(version),
            versionOffDateExtractor.apply(version)), version);
        },
        (table1, table2) -> {
          table2.cellSet().forEach(cell -> {
            if (!table1.contains(cell.getRowKey(), cell.getColumnKey())) {
              table1.put(cell.getRowKey(), cell.getColumnKey(), cell.getValue());
            } else {
              table1.get(cell.getRowKey(), cell.getColumnKey()).putAll(cell.getValue());
            }
          });

          return table1;
        }));
  }

  /**
   * Builds a table of version for a provided  collection of objects
   * @param rowKeyExtractor A function that extracts the first key (row key) from the object to be versioned
   * @param columnKeyExtractor A function that extracts the second key (column key) from the object to be versioned
   * @param versionKeyExtractor A function that extracts the key that defines the version of the object
   * @param versions The objects to be versioned
   * @param <R> The type of the row key
   * @param <C> The type of the column key
   * @param <V> The type of object to be versioned
   * @return A table of versions of object, based on row and column keys
   */
  public static <R, C, V> Table<R, C, NavigableMap<Instant, V>> buildVersionTable(Function<V, R> rowKeyExtractor,
    Function<V, C> columnKeyExtractor,
    Function<V, Instant> versionKeyExtractor,
    Collection<V> versions) {

    return versions.stream()
      .collect(Collector.of(HashBasedTable::create,
        (table, version) -> {
          R rowKey = rowKeyExtractor.apply(version);
          C columnKey = columnKeyExtractor.apply(version);
          if (!table.contains(rowKey, columnKey)) {
            table.put(rowKey, columnKey, new TreeMap<>());
          }

          table.get(rowKey, columnKey).put(versionKeyExtractor.apply(version), version);
        },
        (table1, table2) -> {
          table2.cellSet().forEach(cell -> {
            if (!table1.contains(cell.getRowKey(), cell.getColumnKey())) {
              table1.put(cell.getRowKey(), cell.getColumnKey(), cell.getValue());
            } else {
              table1.get(cell.getRowKey(), cell.getColumnKey()).putAll(cell.getValue());
            }
          });

          return table1;
        }));
  }
}
