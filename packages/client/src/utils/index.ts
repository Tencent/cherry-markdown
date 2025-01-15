/**
 * 预览模式只显示侧边栏
 */
export const previewOnlySidebar = () => {
  const pen = document.querySelector('.cherry-toolbar-pen');
  const markdown = document.getElementById('cherry-markdown');
  if (markdown) {
    markdown.className = 'markdown-preview-only';
  }
  if (pen) {
    pen.className = pen.className.replace('active', '');
    pen.innerHTML = '<i class="ch-icon ch-icon-pen"></i>';
  }
}