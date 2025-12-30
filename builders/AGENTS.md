# BUILDERS KNOWLEDGE BASE

**Location:** `builders/`  
**Count:** 11 service type definitions

## OVERVIEW

Service builders define container types. Underscore prefix (`_`) = internal base class.

## INHERITANCE HIERARCHY

```
_service.js (v3 base)
├── _lando.js
│   ├── _appserver.js
│   │   └── (recipe services extend this)
│   ├── _webserver.js
│   └── _landoutil.js
├── _mounter.js
├── _proxy.js
└── lando.js (user-facing)

_service-v4.js (v4 base, l337 spec)
└── lando-v4.js (user-facing)
```

## BUILDER TYPES

| Type | Prefix | Purpose |
|------|--------|---------|
| Internal | `_` | Base classes, not directly usable |
| Public | none | User-facing service types |

## V3 VS V4

| Aspect | v3 (`_service.js`) | v4 (`_service-v4.js`) |
|--------|-------------------|----------------------|
| Config | Compose YAML | l337 spec + Dockerfile |
| Build | Pre-built images | Build from Dockerfile |
| Flexibility | Limited | Full Docker control |
| Migration | Legacy support | Modern approach |

## EXTENDING BUILDERS

Builders use Factory's functional mixin pattern:

```javascript
'use strict';

module.exports = {
  name: '_myservice',
  parent: '_lando',  // Inherits from _lando
  
  builder: (parent, config) => class MyService extends parent {
    constructor(id, options = {}) {
      super(id, options);
      // Custom initialization
    }
    
    // Override or add methods
  },
};
```

## KEY PROPERTIES

| Property | Purpose |
|----------|---------|
| `name` | Builder identifier (used in Landofile `type:`) |
| `parent` | Parent builder to inherit from |
| `api` | API version (3 or 4) |
| `builder` | Factory function returning class |
| `config` | Default configuration merger |

## GOTCHAS

- **Factory Resolution**: Parent resolved at runtime via Factory, not JS inheritance
- **Config Merging**: Uses lodash `_.merge`, later values override
- **v3/v4 Mixing**: App can have both v3 and v4 services simultaneously
