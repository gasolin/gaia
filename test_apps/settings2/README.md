# Settings2

Settings2 is a prototype settings app created for evaluating the refactoring plan to be implemented in the 1.4 and 1.5 releases. It helps test the solutions in terms of performance, code structure, testability, and feasibility.

## Problems
The current settings app was developed based on the assumption that the app will be launched from the root panel. However, this is not true with the increasing demands of launching specific panels from other apps. Currently basic settings services (mozSettings/UI bindings, panel navigation...) used by all panels and root panel specific logic were mixed and defined in a few modules (Settings, Connectivity). There are also modules that supports multiple panels (Call, Carrier), which means we are not able to lazy load unnecessary logic. Those prevent us from laucnhing the app from any panel sufficiently. Dependencies created by accessing common modules from panels  makes the memory footprint un-managable. And huge modules also lead to bad reusability and testability.

## Solution
The refactoring plan was made with the following items taken into consideration:

1. Module separation
2. Panel separation
3. Inline activities
4. Launch time
5. View/logic separation

The key is to break the panel dependency. This should be done with breaking existing modules into smaller ones, which enables each panel to load only the necessary codes. In Settings2 we introduced require.js for module management. Which allows us to define modules more easily and handles the complexities of the module dependency.

## Current Status
Currently we have a framework that allows us defining modules and is with basic panel navigation. It also supports launching from a specific panel. We are now trying to make the existing panels fit into this framework. In this process we are able to figure out whether the framework sufficient for solving our problem. The following panels has already been added based on the new framework:
- Root
- Battery
- Display
- Sound
- MediaStorage

At the same time we are trying to separate huge modules into smaller ones. For example, logic defined in settings_old.js (deprecated) has been separated to modules like `SettingsService`, `SettingsCache`, `PageTransitions`... etc.

## Key Components
### SettingsService
`SettingsService` provides a navigate function for panel navigation. It gets the corresponding panel module from `PanelCache` and call to its ready and done functions when navigating (see the Panel section).

### PanelCache
`PanelCache` loads panel modules based on panel IDs and caches the loaded modules. If there is no corresponding panel module, it returns `SettingsPanel`.
### Panel
`Panel` defines four basic functions ready, done, init, and uninit for navigation. These functions are called by `SettingsService` when:
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

### SettingsPanel
`SettingsPanel` extends `Panel` with basic settings services. It presets the UI elements based on the values in mozSettings and add listeners responding to mozSettings changes in onReady. In onInit it parses the panel element for activating links. It also removes listeners in onDone so that we can avoid unwanted UI updates when the panel is outside of the viewport.

As we are using require.js for module management, scripts used in a panel should be wrapped in an AMD module or loaded from it, and which should extends from `SettingsPanel` to have basic settings services. Similar to `Panel`, we are able override onReady, onDone, onInit, and onUninit by passing an option object to the constructor of `SettingsPanel`.

## How to?
###How to create a new panel in Settings2?
1. Create an HTML template file with the following format and place it in the elements/ folder.
```sh
  <element name="{panel_name}" extends="section">
    <template>
      <!-- UI elements -->
    </template>
  </element>
```

2. Add the following in the head element of index.html.
```sh
  <link rel="import" href="{path_to_html_template}">
```

3. Add the following in the body element of index.html.
```sh
  <section is="{panel_name}" role="region" id="{panel_id}"></section>
```

### How to load scripts for a panel?
1. Define an AMD module that extends from `SettingsPanel`. You can add other needed modules in the dependency list. It looks like:
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

2. Add a <panel> tag with a "data-path" attrbute specifying the panel module in the end of the panel template. Your HTML file will look like:
```sh
  <element name="{panel_name}" extends="section">
    <template>
      <!-- UI elements -->
      <panel data-path="panels/SamplePanel"></panel>
    </template>
  </element>
```

### Known Problems
- requirejs.undef() may not be sufficient for releasing a loaded module. Need more survey.
