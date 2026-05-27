const SESimulate = {

    widgetLoad: (detail = {}) => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('onWidgetLoad', {
            detail  
          }));
        }, 1);
    },

    follower: (name = 'TestViewer') => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'follower-latest', event: { name } }
      }));
      console.log('[SE] follower-latest fired', name);
    },
  
    subscriber: (name = 'TestViewer', amount = 1, tier = '1000') => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'subscriber-latest', event: { name, amount, tier } }
      }));
      console.log('[SE] subscriber-latest fired', name);
    },
  
    tip: (name = 'TestViewer', amount = 5.00, message = 'Test tip!') => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'tip-latest', event: { name, amount, message } }
      }));
      console.log('[SE] tip-latest fired', name, amount);
    },
  
    cheer: (name = 'TestViewer', amount = 100, message = 'Cheer100') => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'cheer-latest', event: { name, amount, message } }
      }));
      console.log('[SE] cheer-latest fired', name, amount);
    },
  
    host: (name = 'TestChannel', amount = 100) => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'host-latest', event: { name, amount } }
      }));
      console.log('[SE] host-latest fired', name, amount);
    },
  
    raid: (name = 'TestChannel', amount = 50) => {
      window.dispatchEvent(new CustomEvent('onEventReceived', {
        detail: { listener: 'raid-latest', event: { name, amount } }
      }));
      console.log('[SE] raid-latest fired', name, amount);
    },
  
  };
  
  // Auto-fire on load — customize per project
  SESimulate.widgetLoad({
    channel: {
        apiToken: "12345",
        avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/79999200-4bb2-44b2-b1bc-34f3e...",
        id: "12345",
        providerId: "12345",
        username: "Pokemon Trainer"
    },
    currency: {
        code: "USD",
        name: "U.S. Dollar",
        symbol: "$"
    },
    fieldData: {
        gen1: true,
        gen2: true,
        gen3: true,
        gen4: true,
        gen5: true,
        gen6: true,
        gen7: true,
        gen8: true,
        gen9: true,
        colorPrimary: "#ffcb05",
        colorSecondary: "#2a75bb",
        cooldown: 0,
        oneGuessPerPlayer: false,
        jwtToken: null,
        prefix: "?",
        startMode: "auto",
        statsCommand: "?stats",
        timeLimit: 30
  },
    overlay: {
        isEditorMode: false, // set to true to simulate editor mode
        muted: false
    }
  });
