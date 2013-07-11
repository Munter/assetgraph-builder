var cssom = require('cssom-papandreou');

module.exports = function () {
    var rulesPerStylesheetLimit = 4095,
        countRules = function (cssAsset) {
            var count = 0;

            cssAsset.parseTree.cssRules.forEach(function (rule) {
                if (rule.selectorText) {
                    count += rule.selectorText.split(',').length;
                }
            });

            return count;
        },
        splitStyleSheet = function (cssAsset) {
            var count = countRules(cssAsset),
                output = [],
                clone,
                idx = 0,
                rules = cssAsset.parseTree.cssRules,
                factor = Math.ceil(count / rulesPerStylesheetLimit),
                howMany = Math.floor(rules.length / factor);

            for (var i = 1; i < factor; i += 1) {
                clone = cssom.clone(cssAsset.parseTree);
                clone.cssRules = clone.cssRules.slice(idx, howMany);

                output.push(new cssAsset.assetGraph.Css({
                    parseTree: clone
                }));
                idx += howMany;
            }

            clone = cssom.clone(cssAsset.parseTree);
            clone.cssRules = clone.cssRules.slice(idx);
            output.push(new cssAsset.assetGraph.Css({
                parseTree: clone
            }));

/*
            console.log(output[0].parseTree.cssRules.length);
            console.log(output[1].parseTree.cssRules.length);

            console.log(output[0].text.match(/background/g).length);
*/

            return output;
        };

    return function splitCssIfIeLimitIsReached(assetGraph) {
        assetGraph.findRelations({type: 'HtmlStyle'}).forEach(function (htmlStyle) {
            var cssAsset = htmlStyle.to,
                count = countRules(cssAsset),
                replacements;

            if (count > rulesPerStylesheetLimit) {
                var warning = new Error('WARNING: Old IE CSS rule limit reached. ' + count + ' total rules, ' + (count - rulesPerStylesheetLimit) + ' will be ignored by IE9 and below.');
                warning.asset = cssAsset;

                assetGraph.emit('warn', warning);

                replacements = splitStyleSheet(cssAsset);
            }
        });
    };
};
