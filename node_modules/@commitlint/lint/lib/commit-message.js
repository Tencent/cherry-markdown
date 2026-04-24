export const buildCommitMessage = ({ header, body, footer, }) => {
    let message = header;
    message = body ? `${message}\n\n${body}` : message;
    message = footer ? `${message}\n\n${footer}` : message;
    return message || '';
};
//# sourceMappingURL=commit-message.js.map