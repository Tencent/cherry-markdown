export function streamToPromise(stream) {
    const data = [];
    return new Promise((resolve, reject) => stream
        .on('data', (chunk) => data.push(chunk.toString('utf-8')))
        .on('error', reject)
        .on('end', () => resolve(data)));
}
//# sourceMappingURL=stream-to-promise.js.map