// 路径工具

// 标准化路径分隔符为正斜杠
export const normalizePath = (path: string): string => path.replace(/\\/g, '/');

// 检查路径是否为绝对路径
export const isAbsolutePath = (path: string): boolean => path.includes('/') || path.includes('\\');

// 合并相似目录路径，保留父目录或绝对路径优先
export const mergeSimilarDirectories = (directories: string[]): string[] => {
  if (directories.length <= 1) return directories;

  const absolutePaths = new Map<string, string>(); // normalized -> original
  const relativePaths = new Set<string>();

  directories.forEach((dir) => {
    if (isAbsolutePath(dir)) {
      const normalized = normalizePath(dir);
      if (!absolutePaths.has(normalized)) {
        absolutePaths.set(normalized, dir);
      }
    } else {
      relativePaths.add(dir);
    }
  });

  const sortedAbsolutePaths = Array.from(absolutePaths.keys()).sort((a, b) => a.length - b.length);
  const mergedAbsolutePaths = new Set<string>();

  for (const path of sortedAbsolutePaths) {
    const hasParent = Array.from(mergedAbsolutePaths).some((existing) => path.startsWith(`${existing}/`));
    if (!hasParent) {
      mergedAbsolutePaths.add(absolutePaths.get(path)!);
    }
  }

  const mergedRelativePaths = Array.from(relativePaths).filter((relPath) => {
    return !Array.from(mergedAbsolutePaths).some((absPath) => {
      const normalized = normalizePath(absPath);
      return normalized.endsWith(`/${relPath}`) || normalized.includes(`/${relPath}/`);
    });
  });

  return [...mergedAbsolutePaths, ...mergedRelativePaths];
};
