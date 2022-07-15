export default class MessageService {
    static _messages = [];
    
    static get() {
        return MessageService._messages;
    }

    static add(message) {
        MessageService._messages.push(message);
    }

    static size() {
        return MessageService._messages.length;
    }

    static clear() {
        MessageService._messages.length = 0;
    }
}