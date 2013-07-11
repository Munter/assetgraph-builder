var vows = require('vows'),
    assert = require('assert'),
    _ = require('underscore'),
    seq = require('seq'),
    AssetGraph = require('../lib/AssetGraph');

vows.describe('transforms.splitCssIfIeLimitIsReached').addBatch({
    'After loading a Css test case': {
        topic: function () {
            new AssetGraph({root: __dirname + '/splitCssIfIeLimitReached/'})
                .loadAssets('index.html')
                .populate()
                .run(this.callback);
        },
        'the graph should contain 1 Css asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Css'}).length, 1);
        },
        'the Css asset should contain 4096 rules': function (assetGraph) {
            assert.equal(assetGraph.findAssets({ type: 'Css' })[0].parseTree.cssRules.length, 4096);
        },
        'then running the splitCssIfIeLimitIsReached transform': {
            topic: function (assetGraph) {
                assetGraph.__warnings = [];

                assetGraph
                    .on('warn', function (err) {
                        assetGraph.__warnings.push(err);
                    })
                    .splitCssIfIeLimitIsReached()
                    .run(this.callback);
            },
            'the graph should have 1 emitted warning': function (assetGraph) {
                assert.equal(assetGraph.__warnings.length, 1);
            }
        }
    }
})['export'](module);
