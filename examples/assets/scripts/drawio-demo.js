/**
 * Draw.io integration for Cherry Markdown
 * 
 * This file handles the initialization and communication between the Draw.io editor
 * and the Cherry Markdown editor through postMessage.
 * 
 * Path issues fixed:
 * 1. Corrected the path to the theme XML file
 * 2. Added fallback for language resources
 * 3. Enhanced error handling for resource loading
 * 
 * Usage:
 * 1. Include all required Draw.io scripts in the HTML file
 * 2. Include this script after all Draw.io scripts
 * 3. The editor will initialize automatically and post a 'ready' message to the parent window
 * 4. Use postMessage to communicate with the editor (see addPostMessageListener function)
 */

// Extends EditorUi to update I/O action states based on availability of backend
(function()
{
	var editorUiInit = EditorUi.prototype.init;
	
	EditorUi.prototype.init = function()
	{
		editorUiInit.apply(this, arguments);
	};
	
	// Adds required resources (disables loading of fallback properties, this can only
	// be used if we know that all keys are defined in the language specific file)
	mxResources.loadDefaultBundle = false;
	var bundle = mxResources.getDefaultBundle(mxLanguage) || './assets/drawio_lib/resources/drawio.properties';
	
	// 添加错误处理
	function handleResourceError() {
		console.warn('Failed to load language resources. Using default settings.');
		// 继续初始化，但不加载语言资源
		var themes = new Object();
		themes[Graph.prototype.defaultThemeName] = mxUtils.parseXml('<mxStylesheet><styles /></mxStylesheet>').documentElement;
		window.editorUIInstance = new EditorUi(new Editor(false, themes));
		try {
			addPostMessageListener(editorUIInstance.editor);
		} catch (e) {
			console.error('Failed to initialize postMessage listener:', e);
		}
	}
	// Fixes possible asynchronous requests
	mxUtils.getAll([bundle, './assets/drawio_lib/theme/default.xml'], function(xhr)
	{
		try {
			// Adds bundle text to resources
			if (xhr[0].getText()) {
				mxResources.parse(xhr[0].getText());
			}
			
			// Configures the default graph theme
			var themes = new Object();
			themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement(); 
			
			// Main
			window.editorUIInstance = new EditorUi(new Editor(false, themes));
    
			try {
				addPostMessageListener(editorUIInstance.editor);
				window.parent.postMessage({eventName: 'ready', value: ''}, '*');
			} catch (error) {
				console.error('Error during post message initialization:', error);
			}
		} catch (e) {
			console.error('Error during main initialization:', e);
			handleResourceError();
		}
	}, function(err)
	{
		console.error('Error loading resources:', err);
		document.body.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
		handleResourceError();
	});
})();

function addPostMessageListener(graphEditor) {
  window.addEventListener('message', function(event) {
    if(!event.data || !event.data.eventName) {
        return 
    }
    switch (event.data.eventName) {
      case 'setData':
        var value = event.data.value;
        var doc = mxUtils.parseXml(value);
        var documentName = 'cherry-drawio-' + new Date().getTime();
        editorUIInstance.editor.setGraphXml(null);
        graphEditor.graph.importGraphModel(doc.documentElement);
        graphEditor.setFilename(documentName);
        window.parent.postMessage({eventName: 'setData:success', value: ''}, '*');
        break;
      case 'getData':
        editorUIInstance.editor.graph.stopEditing();
        var xmlData = mxUtils.getXml(editorUIInstance.editor.getGraphXml());
        editorUIInstance.exportImage(1, "#ffffff", true, null, true, 50, null, "png", function(base64, filename){
          window.parent.postMessage({
            mceAction: 'getData:success',
            eventName: 'getData:success',
            value: {
              xmlData: xmlData,
              base64: base64,
            }
          }, '*');
        })
        break;
      case 'ready?':
        window.parent.postMessage({eventName: 'ready', value: ''}, '*');
        break;
      default:
        break;
    }
  }); 
}
