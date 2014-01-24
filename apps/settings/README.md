# Settings

- Allows the user to configure device settings
- Responds to **incoming activities** ('configure'), which allow the user to navigate to specific panel to configue from another app (eg. show the wifi settings panel if no data connection is available).

## Current Stat

Currently basic settings services (mozSettings/UI bindings, panel navigation...) used by all panels and root panel specific logic were mixed and defined in a few modules (Settings, Connectivity). 

The goal is to break the panel dependency. This should be done with breaking existing modules into smaller ones, which enables each panel to load only the necessary codes. And new panels should follow the new code structure so we will achieve:

1. Module separation
2. Panel separation
3. Inline activities
4. View/logic separation

## Modules

We are using [AMD](http://en.wikipedia.org/wiki/Asynchronous_module_definition) modules, loaded using 'Alemeda' (a lighter version of [RequireJS](http://requirejs.org)) and building/optimizing using ['r.js'](http://requirejs.org/docs/optimization.html) (the RequireJS optimizer). We have dependencies on files (`shared/js`)  which aren't AMD modules. For those we use the ['shim'](http://requirejs.org/docs/api.html#config-shim) options in our [`requirejs_config.js`](js/config/require.js)

## module/SettingsService.js
`SettingsService` provides a navigate function for panel navigation. It gets the corresponding panel module from `PanelCache` and call to its ready and done functions when navigating (see the Panel section).

## module/PanelCache.js
`PanelCache` loads panel modules based on panel IDs and caches the loaded modules. If there is no corresponding panel module, it returns `SettingsPanel`.

## module/Panel.js
`Panel` defines four basic functions: ready, done, init, and uninit for navigation. These functions are called by `SettingsService` at the following stats:
- ready:  called when the panel is navigated into the viewport
- done:   called when the panel is navigated out of the viewport
- init:   called at the first time the ready function gets called
- uninit: called when cleanup

onReady, onDone, onInit, and onUninit are called respectively in the basic functions. The syntax of the functions are:
```sh
  function onReady(panelElement [, readyOptions])
  function onDone()
  function onInit(panelElement [, initOptions])
  function onUninit()
```

We are able to override these functions by passing an option object into the constructor of `Panel`. For example,
```sh
  Panel({
    onReady: function(panelElement, readyOptions) { //... }
    onDone: function() { //... }
    onInit: function(panelElement, initOptions) { //... }
    onUninit: function() { //... }
  })
```

Typically we can create DOM element references in onInit, update UI elements and add listeners in onReady, remove listeners in onDone, and do cleanup in onUninit.

## module/SettingsPanel.js
`SettingsPanel` extends `Panel` with basic settings services. It presets the UI elements based on the values in mozSettings and add listeners responding to mozSettings changes in onReady. In onInit it parses the panel element for activating links. It also removes listeners in onDone so that we can avoid unwanted UI updates when the panel is outside of the viewport.

As we are using require.js for module management, scripts used in a panel should be wrapped in an AMD module or loaded from it, and which should extends from `SettingsPanel` to have basic settings services. Similar to `Panel`, we are able override onReady, onDone, onInit, and onUninit by passing an option object to the constructor of `SettingsPanel`.

## Implement Guide
###How to create a new panel in Settings?
1. Create an HTML template file with the following format and place it in the elements/ folder.
```sh
  <element name="{panel_name}" extends="section">
    <template>
      <!-- UI elements -->
    </template>
  </element>
```

2. Add the following `link` tag in the head element of index.html.
```sh
  <link rel="import" href="{path_to_html_template}">
```

3. Add the following `section` tag in the body element of index.html.
```sh
  <section is="{panel_name}" role="region" id="{panel_id}"></section>
```

### How to load scripts for a panel?
1. Define an AMD module that extends from `SettingsPanel`. You can add other needed modules in the dependency list. A simple module looks like:
```sh
  define('panels/SamplePanel', ['modules/SettingsPanel', 'modules/Module1', 'modules/Module2'],
    function(SettingsPanel, Module1, Module2) {
      return SettingsPanel({
        onInit: function(rootElement, initOptions) {
          //...
        },
        onUninit: function() {
          //...
        },
        onReady: function(rootElement, readyOptions) {
          //...
        },
        onDone: function() {
          //...
        }
      });
  });
```

2. Add a <panel> tag with a "data-path" attrbute specifying the panel module in the end of the panel template. The HTML file looks like:
```sh
  <element name="{panel_name}" extends="section">
    <template>
      <!-- UI elements -->
      <panel data-path="panels/SamplePanel"></panel>
    </template>
  </element>
```

###How to port old panel to new structure in Settings?

1. find panel href={element} in index.html

2. find panel element in element/{element}.html
replace the line
```
<script src="js/<panel name>.js"></script>
```
to
```
<panel data-path="panels/<Capital panel name>Panel"></panel>
```
for `support` panel, it denotes replace `js/support.js` to `panels/SupportPanel`.

3. create `modules/Support.js`

4. create new `panels/SupportPanel.js` and include module/Support

5. test with command for integration test
`sudo make test-integration APP=settings`

## Build step

The settings app has it's own [`Makefile`](Makefile). A Makefile is similar to Grunt, but written in bash, it is essentially a list of tasks that can be run (via `make <task-name>`). When a Gaia application has its own `apps/<app-name>/Makefile`, it will be automatically run when Gaia builds.

Our `Makefile` has two tasks, one to **'build'** and one to **'clean'** (delete the build). The build steps are as follows:

1. Remove any previous settings build from the `build_stage/`
2. Create an new directory `build_stage/settings`
3. Run the `r.js` (RequireJS optimizer), pointing it at our `require_config.jslike` file (`.jslike` because we don't want Gaia builds to mess with it [I think]). This copies our entire application (JS and all) and bundles our JS (tracing `require()` calls) and CSS (tracing `@import`) in two single files.

