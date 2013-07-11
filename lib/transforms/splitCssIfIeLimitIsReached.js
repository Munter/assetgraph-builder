module.exports = function () {
    return function splitCssIfIeLimitIsReached(assetGraph) {
        assetGraph.findRelations({type: 'HtmlStyle'}).forEach(function (htmlStyle) {
            var cssAsset = htmlStyle.to,
                htmlAsset = htmlStyle.from,
                document = htmlAsset.parseTree,
                count = 0;

            cssAsset.parseTree.cssRules.forEach(function (rule) {
                if (rule.selectorText) {
                    count += rule.selectorText.split(',').length;
                }
            });
            if (count > 4095) {
                var warning = new Error('WARNING: Old IE CSS rule limit reached. ' + count + ' total rules, ' + (count - 4095) + ' will be ignored by IE9 and below.');
                warning.asset = cssAsset;
                assetGraph.emit('warn', warning);

                var internetExplorerConditionalCommentBody = new assetGraph.Html({text: ""});
            }
        });
    };
};
