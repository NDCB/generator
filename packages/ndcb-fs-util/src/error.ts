/**
 * https://man7.org/linux/man-pages/man2/stat.2.html#ERRORS
 */
export enum StatusErrorCode {
  /**
   * Search permission denied for one of the directories in the path prefix.
   */
  EACCES = "EACCES",

  /**
   * Too many symbolic links encountered while traversing the path.
   */
  ELOOP = "ELOOP",

  /**
   * The path is too long.
   */
  ENAMETOOLONG = "ENAMETOOLONG",

  /**
   * A component of the path does not exist or is a dangling symbolic link.
   */
  ENOENT = "ENOENT",

  /**
   * A component of the path prefix is not a directory.
   */
  ENOTDIR = "ENOTDIR",

  /** Invalid file descriptor. */
  // EBADF = "EBADF",

  /** Bad address. */
  // EFAULT = "EFAULT",

  /** Out of memory. */
  // ENOMEM = "ENOMEM",

  /** File attribute overflows data type. */
  // EOVERFLOW = "EOVERFLOW",

  /** Invalid flag. */
  // EINVAL = "EINVAL",
}
