const path = require('path');
const { createSpinner } = require('nanospinner');
const pc = require('picocolors');

const spinner = createSpinner('', {
  frames: ['|', '/', '-', '\\'],
  color: 'cyan',
});

let bindExit = false;
let initialReportDone = false;

const defaultSettings = {
  hide: false,
  successMessage: 'Lint done.',
};

const exitCallback = (exitCode, settings) => {
  if (exitCode === 0) {
    spinner.success({ text: settings.successMessage });
  }
};

const create = (context) => {
  const settings = { ...defaultSettings, ...context.settings.progress };

  if (!bindExit) {
    process.on('exit', (code) => {
      exitCallback(code, settings);
    });
    bindExit = true;
  }

  if (!settings.hide) {
    const filename = context.getFilename();
    const relativeFilePath = path.relative(context.getCwd(), filename);
    spinner.update({ text: `Processing: ${pc.green(relativeFilePath)} \n` });
  } else if (!initialReportDone) {
    spinner.update({ text: 'Linting...\n' });
    initialReportDone = true;
  }

  spinner.spin();
  return {};
};

const progress = {
  name: __filename,
  create,
};

module.exports = progress;
