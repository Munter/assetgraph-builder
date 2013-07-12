var cssom = require('cssom-papandreou'),
    urlTools = require('../../node_modules/assetgraph/lib/util/urlTools');

module.exports = function () {
    var rulesPerStylesheetLimit = 4095,
        countRules = function (cssAsset) {
            var count = 0;

            // FIXME: Verify that this counting algorithm is identical to what IE does
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
            output.push(new cssAsset.assetGraph.createAsset({
                type: 'Css',
                parseTree: clone
            }));

            return output;
        };

    return function splitCssIfIeLimitIsReached(assetGraph) {
        assetGraph.findAssets({type: 'Css', isLoaded: true}).forEach(function (cssAsset) {
            var count = countRules(cssAsset),
                warning,
                replacements;

            if (count > rulesPerStylesheetLimit) {
                warning = new Error('WARNING: Old IE CSS rule limit reached. ' + count + ' total rules, ' + (count - rulesPerStylesheetLimit) + ' will be ignored by IE9 and below.');
                warning.asset = cssAsset;

                assetGraph.emit('warn', warning);

                replacements = splitStyleSheet(cssAsset);

                replacements.forEach(function (cssAsset) {
                    cssAsset.url = urlTools.resolveUrl(assetGraph.root, cssAsset.id + cssAsset.extension);
                    assetGraph.addAsset(cssAsset);
                });

                // Update each html asset that includes this cssAsset
                cssAsset.incomingRelations.forEach(function (htmlStyle) {
                    replacements.forEach(function (cssAsset) {
                        new assetGraph.HtmlStyle({
                            to: cssAsset
                        }).attach(htmlStyle.from, 'before', htmlStyle);
                    });
                });

                assetGraph.removeAsset(cssAsset, true);

                //console.log(assetGraph.findAssets({ type: 'Html' })[0].text);
            }
        });
    };
};
