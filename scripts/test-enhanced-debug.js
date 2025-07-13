// Test script for enhanced Tasks plugin debugging
// This script simulates the enhanced debugging functionality

console.log('🧪 TESTING ENHANCED TASKS PLUGIN DEBUGGING');
console.log('==========================================');

// Simulate the enhanced getObsidianTasksGlobalFilter function
async function getObsidianTasksGlobalFilter(app) {
  try {
    console.log('[TASKS DEBUG] Searching for Tasks plugin...');
    
    // Simulate plugin detection
    const allPlugins = {
      'dataview': { enabled: true },
      'hot-reload': { enabled: true },
      'obsidian-tasks-plugin': {
        enabled: undefined,
        _userDisabled: false,
        _loaded: true,
        _events: [],
        _children: [],
        _lastDataModifiedTime: 0,
        onConfigFileChange: () => {},
        app: {},
        manifest: {},
        cache: {
          logger: {},
          notifySubscribersDebounced: () => {},
          metadataCache: {},
          metadataCacheEventReferences: {},
          vault: {},
          workspace: {},
          vaultEventReferences: {},
          events: {},
          eventsEventReferences: {},
          tasksMutex: {},
          state: {
            settings: {
              globalFilter: '#task'
            }
          },
          tasks: [],
          loadedAfterFirstResolve: true
        },
        inlineRenderer: {},
        queryRenderer: {},
        loadData: async () => ({ globalFilter: '#task' })
      },
      'tangent': { enabled: true }
    };
    
    console.log('[TASKS DEBUG] Available plugins:', Object.keys(allPlugins));
    
    const possiblePluginIds = [
      'obsidian-tasks',
      'tasks',
      'obsidian-tasks-group',
      'obsidian-tasks-group-obsidian-tasks',
      'obsidian-tasks-plugin'
    ];
    
    let tasksPlugin = null;
    let pluginId = null;
    
    for (const id of possiblePluginIds) {
      if (allPlugins[id]) {
        tasksPlugin = allPlugins[id];
        pluginId = id;
        console.log(`[TASKS DEBUG] Found Tasks plugin with ID: ${id}`);
        break;
      }
    }
    
    if (!tasksPlugin) {
      console.log('[TASKS DEBUG] Tasks plugin not found with any known ID');
      return null;
    }
    
    console.log(`[TASKS DEBUG] Tasks plugin enabled: ${tasksPlugin.enabled}`);
    console.log(`[TASKS DEBUG] Tasks plugin settings:`, tasksPlugin.settings);
    console.log(`[TASKS DEBUG] Tasks plugin instance:`, tasksPlugin.instance);
    console.log(`[TASKS DEBUG] Using plugin ID: ${pluginId}`);
    console.log(`[TASKS DEBUG] Full plugin object:`, tasksPlugin);
    
    // Check if plugin is enabled
    const isEnabled = !tasksPlugin._userDisabled;
    console.log(`[TASKS DEBUG] Plugin enabled check: ${isEnabled} (_userDisabled=${tasksPlugin._userDisabled})`);
    
    if (!isEnabled) {
      console.log('[TASKS DEBUG] Tasks plugin appears to be disabled');
      return null;
    }
    
    // Access the plugin settings - try multiple approaches
    let settings = null;
    
    // Try to access the plugin's data directly
    if (tasksPlugin.data) {
      settings = tasksPlugin.data;
      console.log('[TASKS DEBUG] Found settings via tasksPlugin.data');
    } else if (tasksPlugin.settings) {
      settings = tasksPlugin.settings;
      console.log('[TASKS DEBUG] Found settings via tasksPlugin.settings');
    } else if (tasksPlugin.instance?.settings) {
      settings = tasksPlugin.instance.settings;
      console.log('[TASKS DEBUG] Found settings via tasksPlugin.instance.settings');
    } else {
      // Try to access the plugin's internal data
      console.log('[TASKS DEBUG] Trying to access plugin internal data...');
      console.log('[TASKS DEBUG] Plugin properties:', Object.keys(tasksPlugin));
      
      // Look for common data properties
      const dataProperties = ['data', 'settings', 'config', 'options', 'preferences'];
      for (const prop of dataProperties) {
        if (tasksPlugin[prop]) {
          settings = tasksPlugin[prop];
          console.log(`[TASKS DEBUG] Found settings via tasksPlugin.${prop}`);
          break;
        }
      }
      
      // Try to access the plugin's API
      if (!settings && tasksPlugin.apiV1) {
        console.log('[TASKS DEBUG] Trying to access plugin API...');
        try {
          const api = tasksPlugin.apiV1;
          console.log('[TASKS DEBUG] API properties:', Object.keys(api));
          
          if (api.getSettings) {
            settings = api.getSettings();
            console.log('[TASKS DEBUG] Found settings via api.getSettings()');
          } else if (api.settings) {
            settings = api.settings;
            console.log('[TASKS DEBUG] Found settings via api.settings');
          }
        } catch (error) {
          console.log('[TASKS DEBUG] Error accessing API:', error);
        }
      }
      
      // Try to access the plugin's cache
      if (!settings && tasksPlugin.cache) {
        console.log('[TASKS DEBUG] Trying to access plugin cache...');
        console.log('[TASKS DEBUG] Cache properties:', Object.keys(tasksPlugin.cache));
        
        // Look for settings in cache
        if (tasksPlugin.cache.settings) {
          settings = tasksPlugin.cache.settings;
          console.log('[TASKS DEBUG] Found settings via cache.settings');
        }
        
        // Try to access cache state
        if (!settings && tasksPlugin.cache.state) {
          console.log('[TASKS DEBUG] Cache state properties:', Object.keys(tasksPlugin.cache.state));
          if (tasksPlugin.cache.state.settings) {
            settings = tasksPlugin.cache.state.settings;
            console.log('[TASKS DEBUG] Found settings via cache.state.settings');
          }
        }
        
        // Try to access the plugin's internal data through cache
        if (!settings) {
          for (const [key, value] of Object.entries(tasksPlugin.cache)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              console.log(`[TASKS DEBUG] Checking cache.${key} properties:`, Object.keys(value));
              if (value.settings) {
                settings = value.settings;
                console.log(`[TASKS DEBUG] Found settings via cache.${key}.settings`);
                break;
              }
            }
          }
        }
      }
    }
    
    if (!settings) {
      console.log('[TASKS DEBUG] Could not access Tasks plugin settings');
      console.log('[TASKS DEBUG] Available plugin properties:', Object.keys(tasksPlugin));
      
      // Try to access the plugin's internal data through other properties
      console.log('[TASKS DEBUG] Trying to access plugin internal structures...');
      
      // Check if the plugin has a loadData method
      if (typeof tasksPlugin.loadData === 'function') {
        try {
          const loadedData = await tasksPlugin.loadData();
          console.log('[TASKS DEBUG] Loaded data from plugin:', loadedData);
          if (loadedData && typeof loadedData === 'object') {
            settings = loadedData;
            console.log('[TASKS DEBUG] Using loaded data as settings');
          }
        } catch (error) {
          console.log('[TASKS DEBUG] Error loading plugin data:', error);
        }
      }
      
      // Try to access through the plugin's internal structures
      if (!settings) {
        for (const prop of Object.keys(tasksPlugin)) {
          const value = tasksPlugin[prop];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            console.log(`[TASKS DEBUG] Checking plugin.${prop} for settings...`);
            if (value.settings) {
              settings = value.settings;
              console.log(`[TASKS DEBUG] Found settings via plugin.${prop}.settings`);
              break;
            }
          }
        }
      }
      
      if (!settings) {
        console.log('[TASKS DEBUG] Still could not access Tasks plugin settings');
        return null;
      }
    }
    
    console.log('[TASKS DEBUG] Available settings properties:', Object.keys(settings));
    
    // The global filter is typically stored in the settings
    const possibleFilterProperties = [
      'globalFilter',
      'globalFilterString',
      'filter',
      'defaultFilter',
      'globalQuery'
    ];
    
    for (const prop of possibleFilterProperties) {
      if (settings[prop] && typeof settings[prop] === 'string' && settings[prop].trim()) {
        console.log(`[TASKS DEBUG] Found global filter in property '${prop}':`, settings[prop]);
        return settings[prop].trim();
      }
    }
    
    console.log('[TASKS DEBUG] No global filter found in Tasks plugin settings');
    console.log('[TASKS DEBUG] All settings values:', settings);
    return null;
    
  } catch (error) {
    console.error('[TASKS DEBUG] Error accessing Tasks plugin:', error);
    return null;
  }
}

// Test the function
async function testEnhancedDebug() {
  const mockApp = {
    plugins: {
      plugins: {
        'dataview': { enabled: true },
        'obsidian-tasks-plugin': {
          enabled: undefined,
          _userDisabled: false,
          cache: {
            state: {
              settings: {
                globalFilter: '#task'
              }
            }
          },
          loadData: async () => ({ globalFilter: '#task' })
        }
      }
    }
  };
  
  console.log('\n🔍 Testing enhanced debugging...');
  const result = await getObsidianTasksGlobalFilter(mockApp);
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('Expected global filter: #task');
  console.log('Actual global filter:', result);
  console.log('Test passed:', result === '#task');
  
  if (result === '#task') {
    console.log('✅ Enhanced debugging is working correctly!');
    console.log('✅ The function successfully accessed the global filter through cache.state.settings');
  } else {
    console.log('❌ Enhanced debugging failed to find the global filter');
  }
}

// Run the test
testEnhancedDebug().catch(console.error); 