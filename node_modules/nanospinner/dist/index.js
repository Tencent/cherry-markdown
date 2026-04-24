"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpinner = createSpinner;
const picocolors_1 = __importDefault(require("picocolors"));
const consts_1 = require("./consts");
function getLines(str = '', width = 80) {
    return str
        .replace(/\u001b[^m]*?m/g, '')
        .split('\n')
        .reduce((col, line) => (col += Math.max(1, Math.ceil(line.length / width))), 0);
}
function createSpinner(text = '', opts = {}) {
    let current = 0, interval = opts.interval || 50, stream = opts.stream || process.stderr, frames = opts.frames && opts.frames.length ? opts.frames : consts_1.symbols.frames, color = opts.color || 'yellow', spinning = false, lines = 0, timer = undefined, getText = (opts = {}) => typeof opts === 'string' ? opts : opts.text || text, getUpdate = (opts = {}) => typeof opts === 'string' ? false : !!opts.update, getColor = (opts = {}) => typeof opts === 'string' || !opts.color ? color : opts.color, getMark = (opts = {}, fallback) => typeof opts === 'string' || !opts.mark ? fallback : opts.mark, mountProcessEvents = () => {
        process.on('SIGINT', exit);
        process.on('SIGTERM', exit);
    }, cleanupProcessEvents = () => {
        process.off('SIGINT', exit);
        process.off('SIGTERM', exit);
    };
    let spinner = {
        reset() {
            current = 0;
            lines = 0;
            spinning = false;
            clearTimeout(timer);
            timer = undefined;
            return spinner;
        },
        clear() {
            spinner.write('\x1b[1G');
            for (let i = 0; i < lines; i++) {
                i > 0 && spinner.write('\x1b[1A');
                spinner.write('\x1b[2K\x1b[1G');
            }
            lines = 0;
            return spinner;
        },
        write(str, clear = false) {
            if (clear && consts_1.isTTY)
                spinner.clear();
            stream.write(str);
            return spinner;
        },
        render() {
            let str = `${picocolors_1.default[color](frames[current])} ${text}`;
            consts_1.isTTY ? spinner.write(`\x1b[?25l`) : (str += '\n');
            spinner.write(str, true);
            consts_1.isTTY && (lines = getLines(str, stream.columns));
            return spinner;
        },
        spin() {
            spinner.render();
            current = ++current % frames.length;
            return spinner;
        },
        update(opts) {
            if (typeof opts === 'string') {
                text = opts;
            }
            else {
                text = opts.text || text;
                frames = opts.frames && opts.frames.length ? opts.frames : frames;
                interval = opts.interval || interval;
                color = opts.color || color;
            }
            if (frames.length - 1 < current)
                current = 0;
            return spinner;
        },
        loop() {
            consts_1.isTTY && (timer = setTimeout(() => spinner.loop(), interval));
            return spinner.spin();
        },
        start(opts = {}) {
            timer && spinner.reset();
            spinning = true;
            mountProcessEvents();
            return spinner.update({ text: getText(opts), color: getColor(opts) }).loop();
        },
        stop(opts) {
            spinning = false;
            clearTimeout(timer);
            timer = undefined;
            cleanupProcessEvents();
            const update = getUpdate(opts);
            const mark = picocolors_1.default[getColor(opts)](getMark(opts, frames[current]));
            const text = getText(opts);
            spinner.write(opts ? `${mark} ${text}${update ? '' : '\n'}` : '', true);
            return consts_1.isTTY && !update ? spinner.write(`\x1b[?25h`) : spinner;
        },
        success(opts = {}) {
            return spinner.stop({
                text: getText(opts),
                mark: getMark(opts, consts_1.symbols.tick),
                color: 'green',
                update: getUpdate(opts),
            });
        },
        error(opts = {}) {
            return spinner.stop({
                text: getText(opts),
                mark: getMark(opts, consts_1.symbols.cross),
                color: 'red',
                update: getUpdate(opts),
            });
        },
        warn(opts = {}) {
            return spinner.stop({
                text: getText(opts),
                mark: getMark(opts, consts_1.symbols.warn),
                color: 'yellow',
                update: getUpdate(opts),
            });
        },
        info(opts = {}) {
            return spinner.stop({
                text: getText(opts),
                mark: getMark(opts, consts_1.symbols.info),
                color: 'blue',
                update: getUpdate(opts),
            });
        },
        isSpinning() {
            return spinning;
        },
    };
    function exit(signal) {
        if (spinning) {
            spinner.stop();
        }
        process.exit(signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1);
    }
    return spinner;
}
