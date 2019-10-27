"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transformQuery = function (query, parameters) {
    var quoteCharacters = ["'", '"'];
    var newQueryString = '';
    var currentQuote = null;
    var srcIndex = 0;
    var destIndex = 0;
    for (var i = 0; i < query.length; i += 1) {
        var currentCharacter = query[i];
        var currentCharacterEscaped = i !== 0 && query[i - 1] === '\\';
        if (currentCharacter === '?' && !currentQuote) {
            var parameter = parameters[srcIndex];
            if (Array.isArray(parameter)) {
                var additionalParameters = parameter.map(function (_, index) {
                    return ":param_" + (destIndex + index);
                });
                newQueryString += additionalParameters.join(', ');
                destIndex += additionalParameters.length;
            }
            else {
                newQueryString += ":param_" + destIndex;
                destIndex += 1;
            }
            srcIndex += 1;
        }
        else {
            newQueryString += currentCharacter;
            if (quoteCharacters.includes(currentCharacter) && !currentCharacterEscaped) {
                if (!currentQuote) {
                    currentQuote = currentCharacter;
                }
                else if (currentQuote === currentCharacter) {
                    currentQuote = null;
                }
            }
        }
    }
    return newQueryString;
};
var transformParameters = function (parameters) {
    return parameters.reduce(function (params, parameter, index) {
        params["param_" + index] = parameter;
        return params;
    }, {});
};
var expandArrayParameters = function (parameters) {
    return parameters.reduce(function (expandedParameters, parameter) {
        if (Array.isArray(parameter)) {
            expandedParameters.push.apply(expandedParameters, parameter);
        }
        else {
            expandedParameters.push(parameter);
        }
        return expandedParameters;
    }, []);
};
exports.transformQueryAndParameters = function (query, srcParameters) {
    if (srcParameters === void 0) { srcParameters = []; }
    if (!srcParameters.length) {
        return { queryString: query, parameters: [] };
    }
    var queryString = transformQuery(query, srcParameters);
    var expandedParameters = expandArrayParameters(srcParameters);
    var parameters = [transformParameters(expandedParameters)];
    return { queryString: queryString, parameters: parameters };
};
//# sourceMappingURL=transform.utils.js.map