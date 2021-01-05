const LOG_LEVEL = {
    INFO: 0,         // Log everything.
    WARNING: 1,   // Log warnings and errors.
    ERROR: 2,       // Only log errors.
    
    toString: function(log_level) {
        switch(log_level) {
            case LOG_LEVEL.ERROR: return "ERROR";
            case LOG_LEVEL.WARNING: return "WARNING";
            case LOG_LEVEL.INFO: return "INFO";
        }
    }
};

const GLOBAL_LOG_LEVEL = LOG_LEVEL.ERROR;

function log(log_level) {
    return function () {
        var log_string;
        if (log_level >= GLOBAL_LOG_LEVEL) {
            log_string = "[" + LOG_LEVEL.toString(log_level) + "] ";
            for (var i = 0; i < arguments.length; i++) {
                log_string += JSON.stringify(arguments[i]);
            }
            console.log(log_string);
        }
    };
}

var error = log(LOG_LEVEL.ERROR);
var warning = log(LOG_LEVEL.WARNING);
var info = log(LOG_LEVEL.INFO);

module.exports = {
    error: error,
    warning: warning,
    info: info,
};