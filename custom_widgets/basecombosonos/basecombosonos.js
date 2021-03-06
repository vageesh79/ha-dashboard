function basecombosonos(widget_id, url, skin, parameters)
{
	self = this;

    // Initialization

    self.widget_id = widget_id;

    // Parameters may come in useful later on

    self.parameters = parameters;

    self.OnPlayButtonClick = OnPlayButtonClick;
    self.OnPreviousButtonClick = OnPreviousButtonClick;
    self.OnNextButtonClick = OnNextButtonClick;
    self.OnRaiseLevelClick = OnRaiseLevelClick;
    self.OnLowerLevelClick = OnLowerLevelClick;
	self.OnPlaylistSelectChange = OnPlaylistSelectChange;

    self.min_level = 0;
    self.max_level = 1;

    if ("step" in self.parameters)
    {
        self.step = self.parameters.step / 100;
    }
    else
    {
        self.step = 0.02;
    }

    var callbacks =
        [
            {"selector": '#' + widget_id + ' #play',            "action": "click",  "callback": self.OnPlayButtonClick},
            {"selector": '#' + widget_id + ' #level-up',        "action": "click",  "callback": self.OnRaiseLevelClick},
            {"selector": '#' + widget_id + ' #level-down',      "action": "click",  "callback": self.OnLowerLevelClick},
            {"selector": '#' + widget_id + ' #previous',        "action": "click",  "callback": self.OnPreviousButtonClick},
            {"selector": '#' + widget_id + ' #next',            "action": "click",  "callback": self.OnNextButtonClick},
			
	        {"selector": '#' + widget_id + ' #select-playlist', "action": "change", "callback": self.OnPlaylistSelectChange}
			
        ];

    // Define callbacks for entities - this model allows a widget to monitor multiple entities if needed
    // Initial will be called when the dashboard loads and state has been gathered for the entity
    // Update will be called every time an update occurs for that entity

    self.OnStateAvailable = OnStateAvailable;
    self.OnStateUpdate = OnStateUpdate;

    var monitored_entities =
        [
            {"entity": parameters.entity, "initial": self.OnStateAvailable, "update": self.OnStateUpdate}
			
        ];

    // Finally, call the parent constructor to get things moving
	//

    WidgetBase.call(self, widget_id, url, skin, parameters, monitored_entities, callbacks);

    // Function Definitions

    // The StateAvailable function will be called when
    // self.state[<entity>] has valid information for the requested entity
    // state is the initial state

    function OnStateAvailable(self, state)
    {
		self.entity = state.entity_id;
        self.level = state.attributes.volume_level;
		self.state = state.state;
		self.source = state.source;
		
		
        set_view(self, state)
        if ("dump_capabilities" in self.parameters && self.parameters["dump_capabilities"] == "1")
        {
			console.log("OnStateAvailable self => ", self);
            display_supported_functions(self);
        }
		
		set_playlist_options(self, state.attributes.source_list, state);
		set_playlist_value(self, state);
    }

    // The OnStateUpdate function will be called when the specific entity
    // receives a state update - its new values will be available
    // in self.state[<entity>] and returned in the state parameter

    function OnStateUpdate(self, state)
    {
		console.log("OnStateUpdate");
        self.level = state.attributes.volume_level;
        set_view(self, state)
    }

    function OnPlayButtonClick(self)
    {
        if (self.entity_state[self.entity].state !== "playing")
        {
            if (is_supported(self, "PLAY_MEDIA"))
            {
				// Don't want to just "play", but rather play the selected playlist
				//
                // args = self.parameters.post_service_play_pause;
                // self.call_service(self, args)
				
				args = self.parameters.post_service_select_playlist
				
				args["source"] = self.ViewModel.selectedoption();
				
				console.log("Play click, args:", args)

				self.call_service(self, args);				
				
            }
            else
            {
                console.log("Play attribute not supported")
            }
        }
        else
        {
            if (is_supported(self, "PAUSE"))
            {
                args = self.parameters.post_service_pause;
                self.call_service(self, args)
            }
            else if (is_supported(self, "STOP"))
            {
                args = self.parameters.post_service_stop;
                self.call_service(self, args)
            }
            else
            {
                // Try Play/Pause
                args = self.parameters.post_service_play_pause;
                self.call_service(self, args)
            }
        }
    }

    function OnPreviousButtonClick(self)
    {
        if (is_supported(self, "PREVIOUS_TRACK"))
        {
            args = self.parameters.post_service_previous;
            self.call_service(self, args)
        }
        else
        {
            console.log("NEXT_TRACK attribute not supported")
        }
    }

    function OnNextButtonClick(self)
    {
        if (is_supported(self, "NEXT_TRACK"))
        {
            args = self.parameters.post_service_next;
            self.call_service(self, args)
        }
        else
        {
            console.log("NEXT_TRACK attribute not supported")
        }
    }
	
	function OnPlaylistSelectChange(self, state)
	{
		var curEntity = self.entity_state[self.entity];
		var entityState = curEntity.state;
		var entitySource = curEntity.attributes.source;
		var entityName = curEntity.entity_id;
		var selectedSource = self.ViewModel.selectedoption();
		var selectedState = self.state;
		
		self.source = selectedSource;

		setTimeout(function(){
			console.log(self.entity_state[self.entity].entity_id + " fcn entityState => ", entityState);
			console.log(self.entity_state[self.entity].entity_id + " fcn entitySource => ", entitySource);
			console.log(self.entity_state[self.entity].entity_id + " fcn entityName => ", entityName);
			console.log(self.entity_state[self.entity].entity_id + " fcn selectedSource => ", selectedSource);
			console.log(self.entity_state[self.entity].entity_id + " fcn selectedState => ", selectedState);
			
			if ((self.state === "playing") 
				&& (entitySource != self.ViewModel.selectedoption()))
			{	
				console.log("######################## They Dont Match!");
				
				self.source = self.ViewModel.selectedoption();
				args = self.parameters.post_service_select_playlist
				
				args["source"] = self.source
				console.log("Calling Service => ", args);

				self.call_service(self, args);
			}
			else
			{
				console.log("######################## They Match!");
			}
		},500)
	}	

    function OnRaiseLevelClick(self)
    {
        self.level = Math.round((self.level + self.step) * 100) / 100;
        if (self.level > self.max_level)
        {
            self.level = self.max_level
        }

        args = self.parameters.post_service_level;
        args["volume_level"] = self.level;
        self.call_service(self, args)

    }

    function OnLowerLevelClick(self)
    {
        self.level = Math.round((self.level - self.step) * 100) / 100;
        if (self.level < self.min_level)
        {
            self.level = self.min_level
        }

        args = self.parameters.post_service_level;
        args["volume_level"] = self.level;
        self.call_service(self, args)
    }

	function set_playlist_options(self, options, state)
	{
		self.set_field(self, "inputoptions", options);
	}

	function set_playlist_value(self, state)
	{
		value = state.attributes.source
		self.set_field(self, "selectedoption", value)
	}

    function set_view(self, state)
    {
        if (state.state === "playing")
        {
            self.set_field(self, "state", "playing");
            self.set_field(self, "play_icon_style", self.css.icon_style_active);
            self.set_icon(self, "play_icon", self.icons.pause_icon)
        }
        else
        {
            self.set_field(self, "state", self.entity_state[self.entity].state);
            self.set_field(self, "play_icon_style", self.css.icon_style_inactive);
            self.set_icon(self, "play_icon", self.icons.play_icon);
        }

        if ("media_artist" in state.attributes)
        {
            self.set_field(self, "artist", state.attributes.media_artist);
        }

        if ("media_album_name" in state.attributes)
        {
            self.set_field(self, "album", state.attributes.media_album_name)
        }
		
        if ("media_title" in state.attributes)
        {
            if ("truncate_name" in self.parameters)
            {
                name = state.attributes.media_title.substring(0, self.parameters.truncate_name);
            }
            else
            {
                name = state.attributes.media_title;
            }
            self.set_field(self, "media_title", name);
        }
		
		if ("source" in state.attributes)
		{
			self.set_field(self, "selectedoption", state.attributes.source)
		}
		
        if ("volume_level" in state.attributes)
        {
            self.set_field(self, "level", Math.round(state.attributes.volume_level * 100));
        }
        else
        {
            self.set_field(self, "level", 0);
        }

    }

    function is_supported(self, attr)
    {
        var support =
            {
                "PAUSE": 1,
                "SEEK": 2,
                "VOLUME_SET": 4,
                "VOLUME_MUTE": 8,
                "PREVIOUS_TRACK": 16,
                "NEXT_TRACK": 32,
                "TURN_ON": 128,
                "TURN_OFF": 256,
                "PLAY_MEDIA": 512,
                "VOLUME_STEP": 1024,
                "SELECT_SOURCE": 2048,
                "STOP": 4096,
                "CLEAR_PLAYLIST": 8192,
                "PLAY": 16384,
                "SHUFFLE_SET": 32768
            };

        var supported = self.entity_state[parameters.entity].attributes.supported_features;

        if (attr in support)
        {
            var attr_value = support[attr];
            if ((supported & attr_value) == attr_value)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            console.log("Unknown media player attribute: " + attr);
            return false;
        }
    }

    function display_supported_functions(self)
    {
        console.log(self.parameters.entity);
        console.log("Supported Features: " + self.entity_state[parameters.entity].attributes.supported_features);
        console.log("PAUSE: " + is_supported(self, "PAUSE"));
        console.log("SEEK: " + is_supported(self, "SEEK"));
        console.log("VOLUME_SET: " + is_supported(self, "VOLUME_SET"));
        console.log("VOLUME_MUTE: " + is_supported(self, "VOLUME_MUTE"));
        console.log("PREVIOUS_TRACK: " + is_supported(self, "PREVIOUS_TRACK"));
        console.log("NEXT_TRACK: " + is_supported(self, "NEXT_TRACK"));
        console.log("TURN_ON: " + is_supported(self, "TURN_ON"));
        console.log("TURN_OFF: " + is_supported(self, "TURN_OFF"));
        console.log("PLAY_MEDIA: " + is_supported(self, "PLAY_MEDIA"));
        console.log("VOLUME_STEP: " + is_supported(self, "VOLUME_STEP"));
        console.log("SELECT_SOURCE: " + is_supported(self, "SELECT_SOURCE"));
        console.log("STOP: " + is_supported(self, "STOP"));
        console.log("CLEAR_PLAYLIST: " + is_supported(self, "CLEAR_PLAYLIST"));
        console.log("PLAY: " + is_supported(self, "PLAY"));
        console.log("SHUFFLE_SET: " + is_supported(self, "SHUFFLE_SET"));
    }
}
