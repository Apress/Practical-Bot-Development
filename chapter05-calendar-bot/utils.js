exports.wrapEntity = function(entityType, value) {
    return {
        type: entityType,
        entity: value
    };
};
