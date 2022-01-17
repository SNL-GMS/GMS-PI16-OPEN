package gms.shared.utilities.validation;

import java.io.File;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * A class used to validate paths have an expected starting point to prevent potential security risks
 * and manipulation.
 */
public class PathValidation {

  //private constructor
  private PathValidation() {
  }

  /**
   * Validation for string paths
   *
   * @param path path of directory
   * @param expectedBasePath substring that is the expected start of the path
   * @return a boolean representing if start of path matches expectedBasePath
   */
  public static boolean validateDirectoryPath(String path, String expectedBasePath) {
    return Paths.get(path).normalize().toAbsolutePath().startsWith(expectedBasePath);
  }

  /**
   * @param path Url object
   * @param expectedBasePath substring that is the expected start of the path
   * @return a boolean representing if start of path matches expectedBasePath
   */
  public static boolean validateDirectoryPath(URL path, String expectedBasePath) {
    return Paths.get(path.getPath()).normalize().startsWith(expectedBasePath);

  }

  /**
   * @param path File object
   * @param expectedBasePath substring that is the expected start of the path
   * @return a boolean representing if start of path matches expectedBasePath
   */
  public static boolean validateDirectoryPath(File path, String expectedBasePath) {
    return Paths.get(path.toURI()).normalize().startsWith(expectedBasePath);
  }

  /**
   * @param path Path object
   * @param expectedBasePath substring that is the expected start of the path
   * @return a boolean representing if start of path matches expectedBasePath
   */
  public static boolean validateDirectoryPath(Path path, String expectedBasePath) {
    return Paths.get(path.toUri()).normalize().startsWith(expectedBasePath);
  }
}
