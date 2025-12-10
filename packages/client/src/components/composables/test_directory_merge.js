/**
 * 测试目录合并逻辑
 * 验证重新设计的 mergeSimilarDirectories 函数是否正确工作
 */

// 模拟重新设计的 mergeSimilarDirectories 函数的逻辑
function mergeSimilarDirectories(directories) {
  const mergedDirectories = new Set();
  
  // 按路径长度排序，从长到短
  const sortedDirs = [...directories].sort((a, b) => b.length - a.length);
  
  // 收集所有相对路径和绝对路径
  const relativePaths = new Set();
  const absolutePaths = new Set();
  
  // 先分类路径
  directories.forEach(dir => {
    if (dir.includes('/') || dir.includes('\\')) {
      absolutePaths.add(dir);
    } else {
      relativePaths.add(dir);
    }
  });
  
  for (const dirPath of sortedDirs) {
    let shouldAdd = true;
    
    // 检查当前目录是否已经是其他目录的子目录
    for (const existingDir of mergedDirectories) {
      // 标准化路径分隔符进行比较
      const normalizedDirPath = dirPath.replace(/\\/g, '/');
      const normalizedExistingDir = existingDir.replace(/\\/g, '/');
      
      // 使用路径分隔符进行更精确的匹配
      if (normalizedDirPath.startsWith(normalizedExistingDir + '/') || normalizedDirPath === normalizedExistingDir) {
        shouldAdd = false;
        break;
      }
      
      // 检查当前目录是否是现有目录的父目录
      if (normalizedExistingDir.startsWith(normalizedDirPath + '/') || normalizedExistingDir === normalizedDirPath) {
        // 如果现有目录是当前目录的子目录，移除现有目录
        mergedDirectories.delete(existingDir);
      }
    }
    
    // 对于相对路径，检查是否已有包含该相对路径的绝对路径
    if (shouldAdd && !dirPath.includes('/') && !dirPath.includes('\\')) {
      for (const absolutePath of absolutePaths) {
        const normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
        if (normalizedAbsolutePath.endsWith('/' + dirPath) || normalizedAbsolutePath.includes('/' + dirPath + '/')) {
          shouldAdd = false;
          break;
        }
      }
    }
    
    if (shouldAdd) {
      mergedDirectories.add(dirPath);
    }
  }
  
  return Array.from(mergedDirectories);
}

// 测试用例
const testCases = [
  {
    name: "用户提供的示例",
    input: ["D:\\A\\doc", "doc", "D:\\A\\doc\\dir"],
    expected: ["D:\\A\\doc"]
  },
  {
    name: "多个相似路径",
    input: ["/home/user/docs", "/home/user", "docs", "/home/user/docs/project"],
    expected: ["/home/user"]
  },
  {
    name: "完全不同的路径",
    input: ["/path1", "/path2", "/path3"],
    expected: ["/path1", "/path2", "/path3"]
  },
  {
    name: "嵌套路径",
    input: ["a/b/c", "a/b", "a", "a/b/c/d"],
    expected: ["a"]
  },
  {
    name: "混合路径",
    input: ["C:\\Projects\\App", "Projects", "C:\\Projects\\App\\src", "D:\\Work"],
    expected: ["C:\\Projects\\App", "D:\\Work"]
  }
];

// 运行测试
console.log("=== 目录合并逻辑测试 ===\n");

testCases.forEach((testCase, index) => {
  console.log(`测试用例 ${index + 1}: ${testCase.name}`);
  console.log(`输入: ${JSON.stringify(testCase.input)}`);
  
  const result = mergeSimilarDirectories(testCase.input);
  console.log(`预期: ${JSON.stringify(testCase.expected)}`);
  console.log(`实际: ${JSON.stringify(result)}`);
  
  const passed = JSON.stringify(result.sort()) === JSON.stringify(testCase.expected.sort());
  console.log(`结果: ${passed ? '✓ 通过' : '✗ 失败'}`);
  console.log("---");
});

console.log("\n测试完成！");

/**
 * 调试第二个测试用例
 * 分析为什么 docs 没有被正确合并到 /home/user 中
 */

// 模拟修复后的 mergeSimilarDirectories 函数的逻辑
function mergeSimilarDirectoriesDebug(directories) {
  const mergedDirectories = new Set();
  
  // 按路径长度排序，从长到短
  const sortedDirs = [...directories].sort((a, b) => b.length - a.length);
  
  console.log("排序后目录列表:", sortedDirs);
  
  for (const dirPath of sortedDirs) {
    console.log("\n处理目录:", dirPath);
    let shouldAdd = true;
    
    // 检查当前目录是否已经是其他目录的子目录
    for (const existingDir of mergedDirectories) {
      console.log("  比较现有目录:", existingDir);
      
      // 标准化路径分隔符进行比较
      const normalizedDirPath = dirPath.replace(/\\/g, '/');
      const normalizedExistingDir = existingDir.replace(/\\/g, '/');
      
      console.log("  标准化当前目录:", normalizedDirPath);
      console.log("  标准化现有目录:", normalizedExistingDir);
      
      // 使用路径分隔符进行更精确的匹配
      if (normalizedDirPath.startsWith(normalizedExistingDir + '/') || normalizedDirPath === normalizedExistingDir) {
        console.log("  → 当前目录是现有目录的子目录或相同，跳过");
        shouldAdd = false;
        break;
      }
      
      // 检查当前目录是否是现有目录的父目录
      if (normalizedExistingDir.startsWith(normalizedDirPath + '/') || normalizedExistingDir === normalizedDirPath) {
        console.log("  → 现有目录是当前目录的子目录，移除现有目录");
        mergedDirectories.delete(existingDir);
      }
    }
    
    // 额外检查：如果当前目录是相对路径，检查是否已有对应的绝对路径
    if (shouldAdd && !dirPath.includes('/') && !dirPath.includes('\\')) {
      console.log("  检查相对路径:", dirPath);
      for (const existingDir of mergedDirectories) {
        // 检查相对路径是否是绝对路径的一部分
        const normalizedExistingDir = existingDir.replace(/\\/g, '/');
        console.log("  检查绝对路径:", normalizedExistingDir);
        console.log("  是否包含 /" + dirPath + "/:", normalizedExistingDir.includes('/' + dirPath + '/'));
        console.log("  是否以 /" + dirPath + " 结尾:", normalizedExistingDir.endsWith('/' + dirPath));
        
        if (normalizedExistingDir.includes('/' + dirPath + '/') || normalizedExistingDir.endsWith('/' + dirPath)) {
          console.log("  → 相对路径已有对应的绝对路径，跳过");
          shouldAdd = false;
          break;
        }
      }
    }
    
    if (shouldAdd) {
      console.log("  → 添加目录到合并列表");
      mergedDirectories.add(dirPath);
    }
    
    console.log("当前合并列表:", Array.from(mergedDirectories));
  }
  
  const result = Array.from(mergedDirectories);
  console.log("\n最终结果:", result);
  return result;
}

// 测试第二个用例：多个相似路径
console.log("=== 调试第二个测试用例 ===\n");
const testInput2 = ["/home/user/docs", "/home/user", "docs", "/home/user/docs/project"];
const expected2 = ["/home/user"];

console.log("输入:", testInput2);
console.log("预期:", expected2);

const result2 = mergeSimilarDirectoriesDebug(testInput2);
console.log("实际:", result2);

const passed2 = JSON.stringify(result2.sort()) === JSON.stringify(expected2.sort());
console.log("结果:", passed2 ? '✓ 通过' : '✗ 失败');