/**
 * Run processors
 */
module.exports = function runProcessors(contents, processor, file) {
  const processors = Array.isArray(processor) ? processor : [processor];
  const result = {file};

  const newContents = processors.reduce((contents, processor) => {
    return processor(contents, file);
  }, contents);

  result.hasChanged = (newContents !== contents);
  return [result, newContents];
};
