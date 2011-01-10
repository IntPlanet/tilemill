var _ = require('underscore')._;

module.exports = function(app, settings) {
    /**
     * Map loader, express route middleware.
     */
    function loadMap(req, res, next) {
        if (req.param('mapfile_64')) {
            var path = require('path');
            var Map = require('tilelive.js').Map;
            var map = new Map(req.param('mapfile_64'), path.join(__dirname, settings.mapfile_dir), true);
            map.localize(function() {
                res.map = map.mapnik_map();
                next();
            });
        }
        else {
            next(new Error('Map could not be loaded.'));
        }
    }

    /**
     * Layer loader, express route middleware.
     */
    function loadLayer(req, res, next) {
        res.layers = [];
        var layers = res.map.layers();
        var data = res.map.describe_data();
        for (var i = 0; i < layers.length; i++) {
            var id = layers[i].datasource.id;
            var layer = {
                id: id,
                fields: data[id] ? data[id].fields : {},
                features: res.map.features(i)
            };
            if (!req.param('layer_id')) {
                res.layers.push(layer);
            }
            else if (req.param('layer_id') === layer.id) {
                res.layers.push(layer);
            }
        }
        if (req.param('layer_id') && res.layers.length === 0) {
            next(new Error('Layer could not be loaded.'));
        }
        next();
    }

    /**
     * Inspect abilities.
     */
    app.get('/abilities', function(req, res) {
        var mapnik = require('mapnik');
        res.send(
            {
                fonts: mapnik.fonts(),
                datasources: mapnik.datasources()
            }
        );
    });

    /**
     * Load layer model.
     */
    app.get('/:mapfile_64/:layer_id?', loadMap, loadLayer, function(req, res, next) {
        if (req.param('layer_id')) {
            res.send(res.layers.pop());
        }
        else {
            res.send(res.layers);
        }
    });

    /**
     * @TODO datasource SRS autodetection endpoint.
     */
    /*
    app.get('/:datasource_64', loadDatasource, function(req, res, next) {
        res.send({});
    });
    */
};
