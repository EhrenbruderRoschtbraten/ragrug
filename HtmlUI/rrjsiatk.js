var CNRIF = {};
CNRIF.VB = {};
CNRIF.View = {};
CNRIF.RTDS = {};
CNRIF.Util = {};

CNRIF.IATK = importNamespace("IATK");

CNRIF.VB.CreateViewBuilder = internal_VBCreate;
CNRIF.VB.InitializeDataView = internal_VBInitializeDataView;
CNRIF.VB.SetSpatialDimension = internal_VBSetSpatialDimension;
CNRIF.VB.SetLinkingField = internal_VBSetLinkingField;
CNRIF.VB.SetColors = internal_VBSetColors;
CNRIF.VB.SetSizes = internal_VBSetSizes;
CNRIF.VB.CreateView = internal_VBCreateView;

CNRIF.View.Get = internal_util_RetrieveViewContainer;
CNRIF.View.Show = internal_ViewShow;
CNRIF.View.SetData = internal_ViewSetData;
CNRIF.View.SetAttribute = internal_ViewSetAttribute;
CNRIF.View.GetAttribute = internal_ViewGetAttribute;
CNRIF.View.SetAllChannels = internal_ViewSetAllChannels;
CNRIF.View.TweenPosition = internal_ViewTweenPosition;
CNRIF.View.TweenSize = internal_ViewTweenSize;
CNRIF.View.GetPositions = internal_ViewGetPositions;
CNRIF.View.GetColors = internal_ViewGetColors;
CNRIF.View.GetFilter = internal_ViewGetFilter;
CNRIF.View.SetMainTexture = internal_ViewSetMainTexture;
CNRIF.View.Destroy = internal_ViewDestroy;
CNRIF.View.AddAxes = internal_ViewAddAxes;
CNRIF.View.SetAxisData = internal_ViewSetAxisData;
CNRIF.View.ShowAxis = internal_ViewShowAxis;
CNRIF.View.SetAxisLength = internal_ViewSetAxisLength;
CNRIF.View.SetAxisTickSpacing = internal_SetAxisTickSpacing;
CNRIF.View.DestroyAxis = internal_ViewDestroyAxis;

CNRIF.RTDS.Create = internal_RTDSCreate;
CNRIF.RTDS.AddDimension = internal_RTDSAddDimension;
CNRIF.RTDS.AddDimensionDiscrete = internal_RTDSAddDimensionDiscrete;
CNRIF.RTDS.SetData = internal_RTDSSetData;
CNRIF.RTDS.GetData = internal_RTDSGetData;
CNRIF.RTDS.SetShiftData = internal_RTDSSetShiftData;
CNRIF.RTDS.GetShiftData = internal_RTDSGetShiftData;
CNRIF.RTDS.Destroy = internal_RTDSDestroy;

CNRIF.Util.LinkingFieldToIndices = internal_util_LinkingFieldToIndices;

CNRIF.MeshTopology = { //UnityEngine.MeshTopology
    Triangles: 0,
    Quads: 2,
    Lines: 3,
    LineStrip: 4,
    Points: 5
}

CNRIF.GeometryType = { //AbstractVisualisation.GeometryType
    Undefined: 0,
    Points: 1,
    Lines: 2,
    Quads: 3,
    LinesAndDots: 4,
    Cubes: 5,
    Bars: 6,
    Spheres: 7
};

CNRIF.ViewAttribute = {
    Size: 0,
    MinSize: 1,
    MaxSize: 2,
    MinNormX: 3,
    MaxNormX: 4,
    MinNormY: 5,
    MaxNormY: 6,
    MinNormZ: 7,
    MaxNormZ: 8,
    MinX: 9,
    MaxX: 10,
    MinY: 11,
    MaxY: 12,
    MinZ: 13,
    MaxZ: 14,
    BlendingDestinationMode: 15,
    BlendingSourceMode: 16
}

CNRIF.ViewData = {
    VertexId: 0,
    Size: 1,
    Filter: 2,
    Color: 3,
    XPosition: 4,
    YPosition: 5,
    ZPosition: 6,
    Indices: 7
}

CNRIF.DataType = { //IATK.DataTypes.DataType
    Undefined: 0,
    Float: 1,
    Int: 2,
    Bool: 3,
    String: 4,
    Date: 5,
    Time: 6,
    Graph: 7
}

CNRIF.DataContext = {
    StrVal: 0,
    StrStr: 1,
    IdxVal: 2,
    IdxStr: 3
}

CNRIF.VBCache = {};

CNRIF.ViewCache = {};
CNRIF.ViewPrefix = "VIEW_";

CNRIF.DataSourceCache = {};
CNRIF.DataSourcePrefix = "RTDS_";

////////////////////////////
// Node-RED Client Functions

// CreateViewBuilder
CNR.clientNodeInitFunctions.RRJSIATK_ViewBuilder = function (node, mNode) {
    node.pointCount = mNode.pointCount;
    node.viewName = mNode.viewName;
    node.meshTopology = mNode.meshTopology;
    node.geometryType = mNode.geometryType;
    return node;
};

CNR.clientFunctions.RRJSIATK_ViewBuilder = function (msg, node) {
    var pointCount = internal_util_GetOrDefault(msg.viewBuilder, "pointCount", node.pointCount);
    var viewName = internal_util_GetOrDefault(msg.viewBuilder, "viewName", node.viewName);
    var meshTopology = internal_util_GetOrDefault(msg.viewBuilder, "meshTopology", node.meshTopology);
    var geometryType = internal_util_GetOrDefault(msg.viewBuilder, "geometryType", node.geometryType);

    // Call all parts of VB life cycle here since setting data and attributes can be done for views, avoid double implementation
    CNRIF.VB.CreateViewBuilder(meshTopology, viewName, geometryType, 0.01, 1); // Initialize min/max size with sensible defaults, customizable through view
    CNRIF.VB.InitializeDataView(viewName, pointCount);
    CNRIF.VB.CreateView(viewName);

    delete msg.viewBuilder; // Remove viewBuilder object since all its work is done, from here on it's a view

    if (!msg.hasOwnProperty("view")){
        msg.view = {};
    }

    // Put everything into the msg, user might want to use it later since VB object is removed
    msg.view.name = viewName;
    msg.view.pointCount = pointCount;
    msg.view.meshTopology = meshTopology;
    msg.view.geometryType = geometryType;

    msg.view.context = 2; // Unbound context

    if (!msg.view.hasOwnProperty("attributes")) {
        msg.view.attributes = [];
    }

    if (!msg.view.hasOwnProperty("data")) {
        msg.view.data = [];
    }

    return msg;
};

// SetViewData
CNR.clientNodeInitFunctions.RRJSIATK_SetViewData = function (node, mNode) {
    node.viewData = parseInt(mNode.viewData, 10);
    return node;
}

CNR.clientFunctions.RRJSIATK_SetViewData = function (msg, node) {
    if (node.viewData >= 0) {
        CNRIF.View.SetData(msg.view.name, node.viewData, msg.view.data[node.viewData]);
    }
    else {
        for (var viewData = 0; viewData <= msg.view.data.length; viewData++) {
            if (msg.view.data[viewData] != null) {
                CNRIF.View.SetData(msg.view.name, viewData, msg.view.data[viewData]);
            }
        }
    }
    return msg;
}

// SetViewAttribute
CNR.clientNodeInitFunctions.RRJSIATK_SetViewAttribute = function (node, mNode) {
    node.attribute = parseInt(mNode.attribute, 10);
    node.attrValue = mNode.attrValue;
    node.attrOverride = mNode.attrOverride;
    return node;
}

CNR.clientFunctions.RRJSIATK_SetViewAttribute = function (msg, node) {
    if (node.attribute >= 0) {
        CNRIF.View.SetAttribute(msg.view.name, node.attribute, node.attrOverride ? node.attrValue : msg.view.attributes[node.attribute]);
    }
    else {
        for (var attribute = 0; attribute <= msg.view.attributes.length; attribute++) {
            var value = msg.view.attributes[attribute];
            if (value != null) {
                CNRIF.View.SetAttribute(msg.view.name, attribute, value);
            }
        }
    }
    return msg;
}

// GetViewData
CNR.clientNodeInitFunctions.RRJSIATK_GetViewData = function (node, mNode) {
    node.viewData = parseInt(mNode.viewData, 10);
    node.location = mNode.location;
    return node;
}

CNR.clientFunctions.RRJSIATK_GetViewData = function (msg, node) {
    var location = internal_util_CreateArrayLocation(msg, node.location, []);

    switch (node.viewData) {
        case 0:
            {
                var positions = CNRIF.View.GetPositions(msg.view.name);
                var x = [];
                var y = [];
                var z = [];

                for (var i = 0; i < positions.length; i++) {
                    x.push(positions[i][0]);
                    y.push(positions[i][1]);
                    z.push(positions[i][2]);
                }

                location[CNRIF.ViewData.XPosition] = x;
                location[CNRIF.ViewData.YPosition] = y;
                location[CNRIF.ViewData.ZPosition] = z;
                break;
            }
        case 1:
            {
                location[CNRIF.ViewData.Color] = CNRIF.View.GetColors(msg.view.name);
                break;
            }
        case 2:
            {
                location[CNRIF.ViewData.Filter] = CNRIF.View.GetFilter(msg.view.name);
                break;
            }
    }

    return msg;
}

// GetViewAttribute
CNR.clientNodeInitFunctions.RRJSIATK_GetViewAttribute = function (node, mNode) {
    node.attribute = parseInt(mNode.attribute, 10);
    node.location = mNode.location;
    return node;
}

CNR.clientFunctions.RRJSIATK_GetViewAttribute = function (msg, node) {
    var location = internal_util_CreateArrayLocation(msg, node.location, []);

    if (node.attribute >= 0) {
        location[node.attribute] = CNRIF.View.GetAttribute(msg.view.name, node.attribute);
    }
    else {
        for (var attribute = 0; attribute < Object.keys(CNRIF.ViewAttribute).length; attribute++) {
            location[attribute] = CNRIF.View.GetAttribute(msg.view.name, attribute);
        }
    }
    return msg;
}

// GetView
CNR.clientNodeInitFunctions.RRJSIATK_GetView = function (node, mNode) {
    node.viewName = mNode.viewName;
    node.onFail = mNode.onFail;
    return node;
}

CNR.clientFunctions.RRJSIATK_GetView = function (msg, node) {
    var view = internal_util_RetrieveViewContainer(node.viewName, "RRJSIATK_GetView").view;
    msg.view = {};
    msg.view.name = node.viewName;
    return msg;

    return (view !== undefined || node.onFail === "true") ? msg : null;
}

// HideShowView
CNR.clientNodeInitFunctions.RRJSIATK_HideShowView = function (node, mNode) {
    node.shown = mNode.shown;
    return node;
}

CNR.clientFunctions.RRJSIATK_HideShowView = function (msg, node) {
    var view = internal_util_RetrieveViewContainer(msg.view.name, "RRJSIATK_HideShowView").view;
    if (view !== undefined) {
        CNRIF.View.Show(msg.view.name, node.shown);
    }

    return msg;
}

// DestroyView
CNR.clientNodeInitFunctions.RRJSIATK_DestroyView = function (node, mNode) {
    return node;
}

CNR.clientFunctions.RRJSIATK_DestroyView = function (msg, node) {
    var viewName = internal_util_GetOrDefault(msg.view, "name", "");
    CNRIF.View.Destroy(viewName);
    return msg;
}

// SetViewContext
CNR.clientNodeInitFunctions.RRJSIATK_SetViewContext = function (node, mNode) {
    node.targetContext = mNode.targetContext;
    return node;
}

CNR.clientFunctions.RRJSIATK_SetViewContext = function (msg, node) {
    var view = internal_util_RetrieveViewContainer(msg.view.name, "RRJSIATK_SetViewContext").view;
    if (view !== undefined) {
        try {
            switch (parseInt(node.targetContext, 10)) {
                case 0:
                    {
                        var world = RT.UE.GameObject.Find("/world");
                        view.transform.SetParent(world.transform, false);
                        break;
                    }
                case 1:
                    {
                        var usercanvas = RT.UE.GameObject.Find("/world/usercanvas");
                        view.transform.SetParent(usercanvas.transform, false);
                        break;
                    }
                case 2:
                    {
                        view.transform.parent = null;
                        break;
                    }
                default:
                    {
                        console.log("RRJSIATK_SetViewContext ERROR => Unknown target context!");
                        return msg;
                    }
            }
            msg.view.context = node.targetContext;
        }
        catch (err) {
            console.log("RRJSIATK_SetViewContext ERROR => " + err);
        }
    }

    return msg;
}

// RTDSCreate
CNR.clientNodeInitFunctions.RRJSIATK_RTDSCreate = function (node, mNode) {
    node.rtdsName = mNode.rtdsName;
    node.dimensionSize = mNode.dimensionSize;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSCreate = function (msg, node) {
    try {
        var rtdsName = node.rtdsName;
        CNRIF.RTDS.Create(rtdsName, node.dimensionSize);

        if (!msg.hasOwnProperty("rtds")) {
            msg.rtds = {};
        }

        msg.rtds.name = rtdsName;
        msg.rtds.dimensionSize = node.dimensionSize;
        msg.rtds.dimensions = [];
        return msg;
    }
    catch (err) {
        console.log("RRJSIATK_RTDSCreate ERROR => " + err);
        return msg;
    }
}

// RTDSAddDimension
CNR.clientNodeInitFunctions.RRJSIATK_RTDSAddDimension = function (node, mNode) {
    node.dimensionName = mNode.dimensionName;
    node.minValue = mNode.minValue;
    node.maxValue = mNode.maxValue;
    node.dataType = mNode.dataType;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSAddDimension = function (msg, node) {
    var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");
    if (CNRIF.RTDS.AddDimension(rtdsName, node.dimensionName, node.minValue, node.maxValue, node.dataType)) {
        msg.rtds.dimensions.push({ name: node.dimensionName, minValue: node.minValue, maxValue: node.maxValue, dataType: node.dataType })
    }

    return msg;
}

// RTDSAddDemensionDiscrete
CNR.clientNodeInitFunctions.RRJSIATK_RTDSAddDimensionDiscrete = function (node, mNode) {
    node.dimensionName = mNode.dimensionName;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSAddDimensionDiscrete = function (msg, node) {
    var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");

    if (CNRIF.RTDS.AddDimensionDiscrete(rtdsName, node.dimensionName)) {
        msg.rtds.dimensions.push({ name: node.dimensionName, categories: node.categories, dataType: node.dataType })
    }

    return msg;
}

// RTDSGet
CNR.clientNodeInitFunctions.RRJSIATK_RTDSGet = function (node, mNode) {
    node.rtdsName = mNode.rtdsName;
    node.onFail = mNode.onFail;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSGet = function (msg, node) {
    try {
        var rtds = internal_util_RetrieveRTDS(node.rtdsName, "RRJSIATK_RTDSGet");
        msg.rtds = {};
        msg.rtds.name = node.rtdsName;

        return (rtds !== undefined || node.onFail === "true") ? msg : null;
    }
    catch (err) {
        console.log("RRJSIATK_RTDSGet ERROR => " + err);
        return null;
    }
}

// RTDSSetData
CNR.clientNodeInitFunctions.RRJSIATK_RTDSSetData = function (node, mNode) {
    node.dimensionName = mNode.dimensionName;
    node.context = mNode.context;
    node.location = mNode.location;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSSetData = function (msg, node) {
    var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");
    var data = internal_util_GetLocation(msg, node.location);
    var rtds = internal_util_RetrieveRTDS(rtdsName, "RRJSIATK_RTDSSetData");
    if (rtds !== undefined) {
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                CNRIF.RTDS.SetData(msg.rtds.name, node.dimensionName, data[i], node.context)
            }
        }
        else {
            CNRIF.RTDS.SetData(msg.rtds.name, node.dimensionName, data, node.context)
        }
    }
    return msg;
}

// RTDSGetData
CNR.clientNodeInitFunctions.RRJSIATK_RTDSGetData = function (node, mNode) {
    node.dimensionName = mNode.dimensionName;
    node.location = mNode.location;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSGetData = function (msg, node) {
    try {
        var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");
        var data = CNRIF.RTDS.GetData(rtdsName, node.dimensionName, true);
        internal_util_CreateArrayLocation(msg, node.location, data);
        return msg;
    }
    catch (err) {
        console.log("RRJSIATK_RTDSGetData ERROR => " + err);
        return msg;
    }
}

// RTDSSetShiftdata
CNR.clientNodeInitFunctions.RRJSIATK_RTDSSetShiftdata = function (node, mNode) {
    node.shiftdata = mNode.shiftdata;
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSSetShiftdata = function (msg, node) {
    try {
        var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");
        CNRIF.RTDS.SetShiftData(rtdsName, parseInt(node.shiftdata) == 1);
        return msg;
    }
    catch (err) {
        console.log("RRJSIATK_RTDSSetShiftdata ERROR => " + err);
        return msg;
    }
}

// RTDSDestroy
CNR.clientNodeInitFunctions.RRJSIATK_RTDSDestroy = function (node, mNode) {
    return node;
}

CNR.clientFunctions.RRJSIATK_RTDSDestroy = function (msg, node) {
    var rtdsName = internal_util_GetOrDefault(msg.rtds, "name", "");
    CNRIF.RTDS.Destroy(rtdsName);
    return msg;
}

// ViewAddAxes
CNR.clientNodeInitFunctions.RRJSIATK_ViewAddAxes = function (node, mNode) {
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewAddAxes = function (msg, node) {
    CNRIF.View.AddAxes(msg.view.name);
    return msg;
}

// ViewSetAxisData
CNR.clientNodeInitFunctions.RRJSIATK_ViewSetAxisData = function (node, mNode) {
    node.dataSource = mNode.dataSource;
    node.dimension = mNode.dimension;
    node.direction = mNode.direction;
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewSetAxisData = function (msg, node) {
    CNRIF.View.SetAxisData(msg.view.name, node.dataSource, node.direction, node.dimension);
    return msg;
}

// ViewSetAxisLength
CNR.clientNodeInitFunctions.RRJSIATK_ViewSetAxisLength = function (node, mNode) {
    node.newLength = mNode.newLength;
    node.direction = mNode.direction;
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewSetAxisLength = function (msg, node) {
    CNRIF.View.SetAxisLength(msg.view.length, node.direction, node.newLength);
    return msg;
}

// ViewShowAxis
CNR.clientNodeInitFunctions.RRJSIATK_ViewShowAxis = function (node, mNode) {
    node.shown = mNode.shown;
    node.direction = mNode.direction;
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewShowAxis = function (msg, node) {
    CNRIF.View.ShowAxis(msg.view.name, node.direction, node.shown);
    return msg;
}

// ViewUpdateAxis
CNR.clientNodeInitFunctions.RRJSIATK_ViewUpdateAxis = function (node, mNode) {
    node.direction = mNode.direction;
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewUpdateAxis = function (msg, node) {
    var container = CNRIF.View.Get(msg.view.name, "RRJSIATK_ViewUpdateAxis");
    container[internal_util_DirectionToField(node.direction)].UpdateAxisTickLabels();
    return msg;
}


// SetAxisTickSpacing
CNR.clientNodeInitFunctions.RRJSIATK_SetAxisTickSpacing = function (node, mNode) {
    node.spacing = mNode.spacing;
    node.direction = mNode.direction;
    node.location = mNode.location;
    return node;
}

CNR.clientFunctions.RRJSIATK_SetAxisTickSpacing = function (msg, node) {
    var newSpacing = internal_util_GetLocation(msg, node.location);
    if (newSpacing === undefined) {
        newSpacing = node.spacing;
    }
    CNRIF.View.SetAxisTickSpacing(msg.view.name, node.direction, newSpacing);
    return msg;
}

// ViewDestroyAxis
CNR.clientNodeInitFunctions.RRJSIATK_ViewDestroyAxis = function (node, mNode) {
    node.direction = mNode.direction;
    return node;
}

CNR.clientFunctions.RRJSIATK_ViewDestroyAxis = function (msg, node) {
    CNRIF.View.DestroyAxis(msg.view.name, node.direction);
    return msg;
}

///////////////////////////
// IATK Interface Functions

function internal_VBCreate(topology, vbName, geometry, minSize, maxSize) {
    try {
        var builder = new CNRIF.IATK.ViewBuilder(topology, ""); // Parent GameObject is discarded once View is created, name is irrelevant here
        var material = CNRIF.IATK.IATKUtil.GetMaterialFromTopology(geometry);
        material.SetFloat("_MinSize", minSize);
        material.SetFloat("_MaxSize", maxSize);

        var instance = {};
        instance.builder = builder;
        instance.material = material;
        instance.geometry = geometry;
        CNRIF.VBCache[vbName] = instance;
    }
    catch (err) {
        console.log("internal_VBCreate ERROR => " + err)
    }
}

function internal_VBInitializeDataView(vbName, pointCount) {
    try {
        var instance = internal_util_RetrieveVB(vbName);
        if (instance !== undefined) {
            instance.builder.initialiseDataView(pointCount);
        }
    }
    catch (err) {
        console.log("internal_VBInitializeDataView ERROR => " + err)
    }
}

function internal_VBSetSpatialDimension(vbName, dimension, data) {
    try {
        var instance = internal_util_RetrieveVB(vbName)
        if (instance !== undefined) {
            instance.builder.setDataDimension(data, dimension);
        }
    }
    catch (err) {
        console.log("internal_VBSetSpatialDimension ERROR => " + err)
    }
}

function internal_VBSetLinkingField(vbName, data) {
    try {
        var instance = internal_util_RetrieveVB(vbName)
        if (instance !== undefined) {
            instance.builder.createIndicesConnectedLineTopology(data);
        }
    }
    catch (err) {
        console.log("internal_VBSetLinkingField ERROR => " + err)
    }
}

function internal_VBSetColors(vbName, data) {
    try {
        var instance = internal_util_RetrieveVB(vbName)
        if (instance !== undefined) {
            instance.builder.setColors(internal_util_DataToColors(data));
        }
    }
    catch (err) {
        console.log("internal_VBSetColors ERROR => " + err)
    }
}

function internal_VBSetSizes(vbName, data) {
    try {
        var instance = internal_util_RetrieveVB(vbName)
        if (instance !== undefined) {
            instance.builder.setSize(data);
        }
    }
    catch (err) {
        console.log("internal_VBSetSizes ERROR => " + err)
    }
}

function internal_VBCreateView(vbName) {
    try {
        var instance = internal_util_RetrieveVB(vbName)
        if (instance !== undefined) {
            instance.builder.updateView();
            var go = new RT.UE.GameObject("");
            var view = instance.builder.apply(go, instance.material);
            view.gameObject.name = CNRIF.ViewPrefix + vbName;
            // Separate view from empty parent
            go.transform.DetachChildren();
            RT.Unity.DestroyGO(go);
            delete CNRIF.VBCache[vbName];
            var viewContainer = {};
            viewContainer.view = view;
            viewContainer.axisX = null;
            viewContainer.axisY = null;
            viewContainer.axisZ = null;
            CNRIF.ViewCache[CNRIF.ViewPrefix + vbName] = viewContainer;
        }
    }
    catch (err) {
        console.log("internal_VBCreateView ERROR => " + err)
    }
}

function internal_ViewShow(viewName, show) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewShow").view;
        if (view !== undefined) {
            view.Show(show);
        }
    }
    catch (err) {
        console.log("internal_ViewShow ERROR => " + err)
    }
}

function internal_ViewSetData(viewName, type, data) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewSetData").view;
        if (view !== undefined) {
            switch (type) {
                case CNRIF.ViewData.VertexId:
                    {
                        view.SetVertexIdChannel(data);
                        break;
                    }
                case CNRIF.ViewData.Size:
                    {
                        view.SetSizeChannel(data);
                        break;
                    }
                case CNRIF.ViewData.Filter:
                    {
                        view.SetFilterChannel(data);
                        break;
                    }
                case CNRIF.ViewData.Color:
                    {
                        view.SetColors(internal_util_DataToColors(data));
                        break;
                    }
                case CNRIF.ViewData.XPosition:
                    {
                        view.UpdateXPositions(data);
                        break;
                    }
                case CNRIF.ViewData.YPosition:
                    {
                        view.UpdateYPositions(data);
                        break;
                    }
                case CNRIF.ViewData.ZPosition:
                    {
                        view.UpdateZPositions(data);
                        break;
                    }
                case CNRIF.ViewData.Indices:
                    {
                        if (data.hasOwnProperty("isLinking") && data.hasOwnProperty("data")) {
                            if (data.isLinking) {
                                view.UpdateIndices(CNRIF.Util.LinkingFieldToIndices(data.data))
                            }
                            else {
                                view.UpdateIndices(data.data);
                            }
                        }
                        else {
                            console.log("internal_ViewSetData (DataType " + type + ") ERROR => Wrong input structure. Proper structure for indices: { isLinking: [true/false], data [...] }")
                        }
                        break;
                    }
                default:
                    {
                        console.log("internal_ViewSetData (DataType " + type + ") ERROR => Unexpected input. Input might be a string instead of a number.")
                        break;
                    }
            }
        }
    }
    catch (err) {
        console.log("internal_ViewSetData (DataType " + type + ") ERROR => " + err)
    }
}

function internal_ViewSetAllChannels(viewName, data) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewSetAllChannels").view;
        if (view !== undefined) {
            view.SetColors(internal_util_DataToVector3(data));
        }
    }
    catch (err) {
        console.log("internal_ViewSetAllChannels ERROR => " + err)
    }
}

function internal_ViewSetAttribute(viewName, attribute, value) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewSetAttribute").view;
        if (view !== undefined) {
            switch (attribute) {
                case CNRIF.ViewAttribute.Size:
                    {
                        view.SetSize(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinSize:
                    {
                        view.SetMinSize(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxSize:
                    {
                        view.SetMaxSize(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinNormX:
                    {
                        view.SetMinNormX(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxNormX:
                    {
                        view.SetMaxNormX(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinNormY:
                    {
                        view.SetMinNormY(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxNormY:
                    {
                        view.SetMaxNormY(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinNormZ:
                    {
                        view.SetMinNormZ(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxNormZ:
                    {
                        view.SetMaxNormZ(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinX:
                    {
                        view.SetMinX(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxX:
                    {
                        view.SetMaxX(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinY:
                    {
                        view.SetMinY(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxY:
                    {
                        view.SetMaxY(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MinZ:
                    {
                        view.SetMinZ(value);
                        break;
                    }
                case CNRIF.ViewAttribute.MaxZ:
                    {
                        view.SetMaxZ(value);
                        break;
                    }
                case CNRIF.ViewAttribute.BlendingDestinationMode:
                    {
                        view.SetBlendindDestinationMode(value);
                        break;
                    }
                case CNRIF.ViewAttribute.BlendingSourceMode:
                    {
                        view.SetBlendingSourceMode(value);
                        break;
                    }
                default:
                    {
                        console.log("internal_ViewSetAttribute (Attribute: " + attribute + ") ERROR => Unexpected attribute. Attribute might be a string instead of a number.");
                        break;
                    }
            }
        }
    }
    catch (err) {
        console.log("internal_ViewSetAttribute (Attribute: " + attribute + ") ERROR => " + err);
    }
}

function internal_ViewGetAttribute(viewName, attribute) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewGetAttribute").view;
        if (view !== undefined) {
            var material = view.BigMesh.SharedMaterial;
            switch (attribute) {
                case CNRIF.ViewAttribute.Size:
                    {
                        return material.GetFloat("_Size");
                    }
                case CNRIF.ViewAttribute.MinSize:
                    {
                        return material.GetFloat("_MinSize");
                    }
                case CNRIF.ViewAttribute.MaxSize:
                    {
                        return material.GetFloat("_MaxSize");
                    }
                case CNRIF.ViewAttribute.MinNormX:
                    {
                        return material.GetFloat("_MinNormX");
                    }
                case CNRIF.ViewAttribute.MaxNormX:
                    {
                        return material.GetFloat("_MaxNormX");
                    }
                case CNRIF.ViewAttribute.MinNormY:
                    {
                        return material.GetFloat("_MinNormY");
                    }
                case CNRIF.ViewAttribute.MaxNormY:
                    {
                        return material.GetFloat("_MaxNormY");
                    }
                case CNRIF.ViewAttribute.MinNormZ:
                    {
                        return material.GetFloat("_MinNormZ");
                    }
                case CNRIF.ViewAttribute.MaxNormZ:
                    {
                        return material.GetFloat("_MaxNormZ");
                    }
                case CNRIF.ViewAttribute.MinX:
                    {
                        return material.GetFloat("_MinX");
                    }
                case CNRIF.ViewAttribute.MaxX:
                    {
                        return material.GetFloat("_MaxX");
                    }
                case CNRIF.ViewAttribute.MinY:
                    {
                        return material.GetFloat("_MinY");
                    }
                case CNRIF.ViewAttribute.MaxY:
                    {
                        return material.GetFloat("_MaxY");
                    }
                case CNRIF.ViewAttribute.MinZ:
                    {
                        return material.GetFloat("_MinZ");
                    }
                case CNRIF.ViewAttribute.MaxZ:
                    {
                        return material.GetFloat("_MaxZ");
                    }
                case CNRIF.ViewAttribute.BlendingDestinationMode:
                    {
                        return material.GetFloat("_MyDstMode");
                    }
                case CNRIF.ViewAttribute.BlendingSourceMode:
                    {
                        return material.GetFloat("_MySrcMode");
                    }
                default:
                    {
                        console.log("internal_ViewGetAttribute (Attribute: " + attribute + ") ERROR => Unexpected attribute. Attribute might be a string instead of a number.");
                        return null;
                    }
            }
        }
    }
    catch (err) {
        console.log("internal_ViewGetAttribute (Attribute: " + attribute + ") ERROR => " + err);
        return null;
    }
}

function internal_ViewSetMainTexture(viewName, texture) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewSetMainTexture").view;
        if (view !== undefined) {
            view.BigMesh.SharedMaterial.mainTexture = texture;
        }
    }
    catch (err) {
        console.log("internal_ViewSetGlyph ERROR => " + err)
    }
}

// Appears to be broken on IATK's side, still here for completeness
function internal_ViewTweenPosition(viewName) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewTweenPosition").view;
        if (view !== undefined) {
            view.TweenPosition();
        }
    }
    catch (err) {
        console.log("internal_ViewTweenPosition ERROR => " + err)
    }
}

// Appears to be broken on IATK's side, still here for completeness
function internal_ViewTweenSize(viewName) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewTweenSize").view;
        if (view !== undefined) {
            view.TweenSize();
        }
    }
    catch (err) {
        console.log("internal_ViewTweenSize ERROR => " + err)
    }
}

function internal_ViewGetPositions(viewName) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewGetPositions").view;
        if (view !== undefined) {
            return internal_util_Vector3ToData(view.GetPositions());
        }
    }
    catch (err) {
        console.log("internal_ViewGetPositions ERROR => " + err)
        return [];
    }
}

function internal_ViewGetColors(viewName) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewGetColors").view;
        if (view !== undefined) {
            return internal_util_ColorsToData(view.GetColors());
        }
    }
    catch (err) {
        console.log("internal_ViewGetColors ERROR => " + err)
        return [];
    }
}

function internal_ViewGetFilter(viewName) {
    try {
        var view = internal_util_RetrieveViewContainer(viewName, "internal_ViewGetFilter").view;
        if (view !== undefined) {
            return view.GetFilterChannel();
        }
    }
    catch (err) {
        console.log("internal_ViewGetFilter ERROR => " + err)
        return [];
    }
}

function internal_ViewDestroy(viewName) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName, "internal_ViewDestroy");
        if (container !== undefined) {
            RT.Unity.DestroyGO(container.view.gameObject);
            delete CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + viewName];
        }
    }
    catch (err) {
        console.log("internal_ViewDestroy ERROR => " + err)
    }
}

function internal_ViewAddAxes(viewName) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName, "internal_ViewAddAxes");
        if (container !== undefined) {
            for (var i = 1; i < 4; i++) {
                var field = internal_util_DirectionToField(i);
                var axis = RT.UE.Object.Instantiate(RT.UE.Resources.Load("Axis")).GetComponent(CNRIF.IATK.Axis);
                container[field] = axis;
                axis.transform.SetParent(container.view.transform);
                var offset = -0.01;
                var pos = [offset, offset, offset];
                pos[i - 1] = 0;
                RT.Unity.SetLocalPose(axis.gameObject, pos, [0, 0, 0, 1], [1, 1, 1]);
                axis.SetDirection(i);
            }
        }
    }
    catch (err) {
        console.log("internal_ViewAddAxes ERROR => " + err);
    }
}

function internal_ViewSetAxisData(viewName, dataName, direction, dimension) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName);
        var data = internal_util_RetrieveRTDS(dataName);
        if (container !== undefined && data !== undefined) {
            var axis = internal_util_GetAxis(container, direction, "internal_ViewSetAxisData", viewName)
            if (axis !== undefined) {
                var filter = new CNRIF.IATK.DimensionFilter();
                filter.Attribute = dimension;
                axis.Initialise(data, filter, null);
            }
        }
    }
    catch (err) {
        console.log("internal_ViewSetAxisData ERROR => " + err);
    }
}

function internal_ViewShowAxis(viewName, direction, show) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName);
        if (container !== undefined) {
            var axis = internal_util_GetAxis(container, direction, "internal_ViewShowAxis", viewName)
            if (axis !== undefined) {
                axis.gameObject.SetActive(show);
            }
        }
    }
    catch (err) {
        console.log("internal_ViewShowAxis ERROR => " + err);
    }
}

function internal_ViewSetAxisLength(viewName, direction, newLength) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName);
        if (container !== undefined) {
            var axis = internal_util_GetAxis(container, direction, "internal_ViewShowAxis", viewName)
            if (axis !== undefined) {
                axis.UpdateLength(newLength);
            }
        }
    }
    catch (err) {
        console.log("internal_ViewSetAxisLength ERROR => " + err);
    }
}

function internal_SetAxisTickSpacing(viewName, direction, newSpacing) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName);
        if (container !== undefined) {
            var axis = internal_util_GetAxis(container, direction, "internal_SetAxisTickSpacing", viewName)
            if (axis !== undefined) {
                axis.UpdateAxisTickSpacing(newSpacing);
            }
        }
    }
    catch (err) {
        console.log("internal_SetAxisTickSpacing ERROR => " + err);
    }
}

function internal_ViewDestroyAxis(viewName, direction) {
    try {
        var container = internal_util_RetrieveViewContainer(viewName);
        if (container !== undefined) {
            var axis = internal_util_GetAxis(container, direction, "internal_ViewShowAxis", viewName)
            if (axis !== undefined) {
                RT.Unity.DestroyGO(axis.gameObject);
                var field = internal_util_DirectionToField(direction);
                container[field] = null;
            }
        }
    }
    catch (err) {
        console.log("internal_ViewSetAxisLength ERROR => " + err);
    }
}

function internal_RTDSCreate(dataName, dimensionSize) {
    try {
        var go = new RT.UE.GameObject(CNRIF.DataSourcePrefix + dataName);
        var rtds = go.AddComponent(CNRIF.IATK.RealtimeDataSource);
        rtds.SetDimensionSizeLimit(dimensionSize);
        CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + dataName] = rtds;
    }
    catch (err) {
        console.log("internal_RTDSCreate ERROR => " + err)
    }
}

function internal_RTDSAddDimension(dataName, dimensionName, min, max, dataType) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSAddDimension");
        if (rtds !== undefined) {
            if (!rtds.AddDimension(dimensionName, min, max, dataType)) {
                console.log("internal_RTDSAddDimension ERROR => Dimension of name \"" + dimensionName + "\" already exists.")
                return false;
            }
            return true;
        }
    }
    catch (err) {
        console.log("internal_RTDSAddDimension ERROR => " + err)
        return false;
    }
}

function internal_RTDSAddDimensionDiscrete(dataName, dimensionName) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSAddDimensionDiscrete");
        if (rtds !== undefined) {
            if (!rtds.AddStringDimension(dimensionName)) {
                console.log("internal_RTDSAddDimensionDiscrete ERROR => Dimension of name \"" + dimensionName + "\" already exists.")
                return false;
            }
            return true;
        }
    }
    catch (err) {
        console.log("internal_RTDSAddDimensionDiscrete ERROR => " + err)
        return false;
    }
}

function internal_RTDSSetData(dataName, dimension, value, context) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSSetData");
        if (rtds !== undefined) {
            switch (parseInt(context, 10)) {
                case 0:
                    {
                        rtds.SetDataStrVal(dimension, value);
                        break;
                    }
                case 1:
                    {
                        rtds.SetDataStrStr(dimension, value);
                        break;
                    }
                // TODO: Implement IdxVal and IdxStr if needed
            }
        }
    }
    catch (err) {
        console.log("internal_RTDSSetData ERROR => " + err)
    }
}

function internal_RTDSGetData(dataName, dimension, isString) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSGetData");
        if (rtds !== undefined) {
            if (isString) {
                return rtds.GetDataByIdentifier(dimension).Data;
            }
            else {
                return rtds.GetDataByIndex(dimension).Data;
            }
        }
    }
    catch (err) {
        console.log("internal_RTDSGetData ERROR => " + err)
        return null;
    }
}

function internal_RTDSSetShiftData(dataName, value) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSSetShiftData");
        if (rtds !== undefined) {
            rtds.SetShiftData(value);
        }
    }
    catch (err) {
        console.log("internal_RTDSSetShiftData ERROR => " + err)
    }
}

function internal_RTDSGetShiftData(dataName)
{
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSGetShiftData");
        if (rtds !== undefined) {
            return rtds.GetShiftData(value);
        }
    }
    catch (err) {
        console.log("internal_RTDSGetShiftData ERROR => " + err)
        return null;
    }
}

function internal_RTDSDestroy(dataName) {
    try {
        var rtds = internal_util_RetrieveRTDS(dataName, "internal_RTDSDestroy");
        if (rtds !== undefined) {
            delete CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + dataName];
            RT.Unity.DestroyGO(rtds.gameObject);
        }
    }
    catch (err) {
        console.log("internal_RTDSDestroy ERROR => " + err)
    }
}

////////////////////
// Utility Functions

function internal_util_RetrieveVB(vbName) {
    if (CNRIF.VBCache.hasOwnProperty(vbName)) {
        return CNRIF.VBCache[vbName];
    }
    console.log("internal_util_RetrieveVB ERROR => failed retrieval of ViewBuilder with name \"" + vbName + "\"");
    return undefined;
}

function internal_util_RetrieveViewContainer(viewName, caller) {
    try {
        if (CNRIF.ViewCache.hasOwnProperty(CNRIF.ViewPrefix + viewName)) {
            var container = CNRIF.ViewCache[CNRIF.ViewPrefix + viewName];
            if (container == null || RT.Unity.IsNull(container.view)) {
                delete CNRIF.ViewCache[CNRIF.ViewPrefix + viewName];
                console.log("internal_util_RetrieveVB (" + caller + ") ERROR => View with name \"" + viewName + "\" appears to have been deleted");
                return undefined;
            }
            return container;
        }

        var go = RT.UE.GameObject.Find(CNRIF.ViewPrefix + viewName); // Undefined behavior if multiple views with the same name exist, should be avoided by user
        if (go == null) {
            console.log("internal_util_RetrieveVB (" + caller + ") ERROR => failed retrieval of View with name \"" + viewName + "\"");
            return undefined;
        }

        var container = {};
        container.view = go.GetComponent(CNRIF.IATK.View);
        container.axisX = null;
        container.axisY = null;
        container.axisZ = null;
        if (container.view == null) {
            console.log("internal_util_RetrieveVB (" + caller + ") ERROR => GameObject with name \"" + viewName + "\" is not a View");
            return undefined;
        }

        CNRIF.ViewCache[CNRIF.ViewPrefix + viewName] = container;
        return container;
    }
    catch (err) {
        console.log("internal_util_RetrieveView (" + caller + ", \"" + viewName + "\") ERROR => " + err)
        return undefined;
    }
}

function internal_util_RetrieveRTDS(dataName, caller) {
    try {
        if (CNRIF.DataSourceCache.hasOwnProperty(CNRIF.DataSourcePrefix + dataName)) {
            var rtds = CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + dataName];
            if (RT.Unity.IsNull(rtds)) {
                delete CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + dataName];
                console.log("internal_util_RetrieveRTDS (\"" + caller + "\") ERROR => Realtime Data Source with name \"" + dataName + "\" appears to have been deleted");
                return undefined;
            }
            return rtds;
        }

        var go = RT.UE.GameObject.Find(CNRIF.DataSourcePrefix + dataName);
        if (go == null) {
            console.log("internal_util_RetrieveRTDS (\"" + caller + "\") ERROR => failed retrieval of Realtime Data Source with name \"" + dataName + "\"");
            return undefined;
        }

        var rtds = go.GetComponent(CNRIF.IATK.RealtimeDataSource);
        if (rtds == null) {
            console.log("internal_util_RetrieveRTDS (\"" + caller + "\") ERROR => GameObject with name \"" + dataName + "\" is not a Realtime Data Source");
            return undefined;
        }

        CNRIF.DataSourceCache[CNRIF.DataSourcePrefix + dataName] = rtds;
        return rtds;
    }
    catch (err) {
        console.log("internal_util_RetrieveRTDS (\"" + caller + "\", \"" + dataName + "\") ERROR => " + err);
        return undefined;
    }
}

function internal_util_DataToColors(data) {
    try {
        colors = [];
        for (let i = 0; i < data.length; i++) {
            var entry = data[i];
            if (entry.length == 3) {
                colors.push(new RT.UE.Color(entry[0], entry[1], entry[2]));
            }
            else if (entry.length == 4) {
                colors.push(new RT.UE.Color(entry[0], entry[1], entry[2], entry[3]));
            }
            else {
                colors.push(new RT.UE.Color(0, 0, 0, 0));
            }
        }
        return colors;
    }
    catch (err) {
        console.log("internal_util_DataToColors ERROR => " + err)
        return [];
    }
}

function internal_util_DataToVector3(data) {
    try {
        vectors = [];
        for (let i = 0; i < data.length; i++) {
            var entry = data[i];
            if (entry.length == 3) {
                vectors.push(new RT.UE.Vector3(entry[0], entry[1], entry[2]));
            }
            else {
                colors.push(new RT.UE.Vector3(0, 0, 0));
            }
        }
        return vectors;
    }
    catch (err) {
        console.log("internal_util_DataToVector3 ERROR => " + err)
        return [];
    }
}

function internal_util_ColorsToData(colors) {
    try {
        data = [];
        for (let i = 0; i < colors.length; i++) {
            color = colors[i];
            entry = [];
            entry.push(color.r);
            entry.push(color.g);
            entry.push(color.b);
            entry.push(color.a);
            data.push(entry);
        }
        return data;
    }
    catch (err) {
        console.log("internal_util_ColorsToData ERROR => " + err)
        return [];
    }
}

function internal_util_Vector3ToData(vectors) {
    try {
        data = [];
        for (let i = 0; i < vectors.length; i++) {
            vector = vectors[i];
            entry = [];
            entry.push(vector.x);
            entry.push(vector.y);
            entry.push(vector.z);
            data.push(entry);
        }
        return data;
    }
    catch (err) {
        console.log("internal_util_Vector3ToData ERROR => " + err)
        return [];
    }
}

function internal_util_LinkingFieldToIndices(linkingField) {
    indices = [];
    for (let i = 0; i < linkingField.length; i++) {
        if (linkingField[i] == linkingField[i + 1]) {
            indices.push(i);
            indices.push(i + 1);
        }
    }
    return indices;
}

function internal_util_GetOrDefault(obj, value, defaultValue) {
    try {
        if (obj !== undefined && obj.hasOwnProperty(value)) {
            return obj[value];
        }
        return defaultValue;
    }
    catch (err) {
        return defaultValue;
    }
}

function internal_util_CreateArrayLocation(msg, locationString, arrayData) {
    var parts = locationString.split(".");
    var last = parts[parts.length - 1];
    var location = msg;
    for (var i = 0; i < parts.length - 1; i++) {
        if (!location.hasOwnProperty(parts[i]) || typeof location[parts[i]] !== "object" || location[parts[i]] == null) {
            location[parts[i]] = {};
        }
        location = location[parts[i]];
    }
    if (!location.hasOwnProperty(last) || Array.isArray(location[last])) {
        location[last] = arrayData;
    }
    return location[last];
}

function internal_util_GetLocation(msg, locationString) {
    try {
        var parts = locationString.split(".");
        var location = msg;
        for (var i = 0; i < parts.length; i++) {
            if (!location.hasOwnProperty(parts[i])) {
                return undefined;
            }
            location = location[parts[i]];
        }
        return location;
    }
    catch (err) {
        console.log("internal_util_GetLocation ERROR => " + err);
        return null;
    }
}

function internal_util_DirectionToField(direction) {
    switch (parseInt(direction, 10)) {
        case 1: return "axisX"; break;
        case 2: return "axisY"; break;
        case 3: return "axisZ"; break;
        default: return "INVALID"; break;
    }
}

function internal_util_GetAxis(container, direction, caller, viewName) {
    var field = internal_util_DirectionToField(direction);
    if (container[field] != null) {
        return container[field];
    }
    else {
        console.log("internal_util_GetAxis (\"" + caller + "\") ERROR => View \"" + viewName + "\" Direction " + direction + " has no axis");
        return undefined;
    }
}