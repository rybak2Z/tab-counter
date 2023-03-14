const LOGGING = true;

const date = new Date()

function logMessage(msg, indentation_level=0, ...other) {
    const time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    const indentation = '  '.repeat(indentation_level);

    console.log(`${indentation}[${time}] ${msg}`);
    
    other.forEach(element => {
        console.log(element);
    })
}

if (!LOGGING) {
    logMessage = function(a, b) {}
}

export const log = logMessage;