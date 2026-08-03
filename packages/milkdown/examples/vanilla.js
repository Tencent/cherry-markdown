import { createCherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';

async function main() {
  await createCherryMilkdown({
    root: document.querySelector('#editor'),
    previewRoot: document.querySelector('#preview'),
    value: '# Cherry Milkdown\n\n[[toc]]\n\nText with $E=mc^2$.',
  });
}

void main();
