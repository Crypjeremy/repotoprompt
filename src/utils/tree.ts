type TreeNode = { [key: string]: TreeNode };

export function buildTree(paths: string[]): string {
  const root: TreeNode = {};

  for (const filePath of paths) {
    const parts = filePath.split('/').filter(Boolean);
    let cursor = root;
    for (const part of parts) {
      cursor[part] ??= {};
      cursor = cursor[part];
    }
  }

  const lines: string[] = [];

  function walk(node: TreeNode, prefix = ''): void {
    const entries = Object.keys(node).sort((a, b) => {
      const aIsDir = Object.keys(node[a]).length > 0;
      const bIsDir = Object.keys(node[b]).length > 0;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${entry}`);
      const children = node[entry];
      if (Object.keys(children).length > 0) {
        walk(children, `${prefix}${isLast ? '    ' : '│   '}`);
      }
    });
  }

  walk(root);
  return lines.join('\n') || '(empty)';
}
