exports.KILZI_CHAT_ID = 454873194;
exports.DORSE_CHAT_ID = 673447790;
exports.LOG_CHANNEL_ID = -1002298860617;
exports.DRIVERS_PHOTO_TYPE = 'DRIVERS';
exports.CONSTRUCTORS_PHOTO_TYPE = 'CONSTRUCTORS';
exports.CURRENT_TEAM_PHOTO_TYPE = 'CURRENT_TEAM';

exports.EXTRACT_JSON_FROM_DRIVERS_PHOTO_SYSTEM_PROMPT = `You are a data extraction assistant. Extract data from photos containing a table of drivers.
Details for extraction:
  - DR: Column #1 — driver initial name
  - $: Column #2 — current price (as a number)
  - X$: Column #3 — expected price change (as a number)
  - XPts: Column #4 — expected points (as a number)
  
Output:
- One array of objects for drivers
- Each object should use full property names: 'price', 'expectedPriceChange', and 'expectedPoints'

Return a JSON object matching this structure:

{
  "Drivers": []
}

Types:

type Driver = {
  DR: string;
  price: number;
  expectedPriceChange: number;
  expectedPoints: number;
};

type Json = {
  Drivers: Driver[];
};`;

exports.EXTRACT_JSON_FROM_CONSTRUCTORS_PHOTO_SYSTEM_PROMPT = `You are a data extraction assistant. Extract data from photos containing a table of constructors.
Details for extraction:
- From the constructors table:
  - CN: Column #1 — constructor initial name
  - $: Column #2 — current price (as a number)
  - X$: Column #3 — expected price change (as a number)
  - XPts: Column #4 — expected points (as a number)
  
Output:
- One array of objects for constructors
- Each object should use full property names: 'price', 'expectedPriceChange', and 'expectedPoints'
- There are 10 constructors

Return a JSON object matching this structure:

{
  "Constructors": []
}

Types:

type Constructor = {
  CN: string;
  price: number;
  expectedPriceChange: number;
  expectedPoints: number;
};

type Json = {
  Constructors: Constructor[];
};
`;

exports.EXTRACT_JSON_FROM_CURRENT_TEAM_PHOTO_SYSTEM_PROMPT = `You are a data extraction assistant. Extract data from photos containing:
- 5 drivers and 2 constructors names
- The driver with DRS boost (2x)
- Number of free transfers
- Remaining cost cap

Output:
- An object containing:
  - 'drivers': array of 5 drivers
  - 'constructors': array of 2 constructors
  - 'drsBoost': driver code with the boost
  - 'freeTransfers': number
  - 'costCapRemaining': number

Return a JSON object matching this structure:

{
  "CurrentTeam": {}
}

Types:

type CurrentTeam = {
  drivers: string[];
  constructors: string[];
  drsBoost: string;
  freeTransfers: number;
  costCapRemaining: number;
};

type Json = {
  CurrentTeam: CurrentTeam;
};`;

exports.PHOTO_TYPE_TO_SYSTEM_PROMPT_MAP = {
  [exports.DRIVERS_PHOTO_TYPE]:
    exports.EXTRACT_JSON_FROM_DRIVERS_PHOTO_SYSTEM_PROMPT,
  [exports.CONSTRUCTORS_PHOTO_TYPE]:
    exports.EXTRACT_JSON_FROM_CONSTRUCTORS_PHOTO_SYSTEM_PROMPT,
  [exports.CURRENT_TEAM_PHOTO_TYPE]:
    exports.EXTRACT_JSON_FROM_CURRENT_TEAM_PHOTO_SYSTEM_PROMPT,
};
