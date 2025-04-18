const {
  EXTRA_DRS_CHIP,
  WILDCARD_CHIP,
  LIMITLESS_CHIP,
} = require('./constants');
const { calculateTeamBudget } = require('./utils');

exports.calculateBestTeams = function (cachedJsonData, selectedChip) {
  // Data for drivers
  const drivers_dict = cachedJsonData.Drivers;

  // Data for constructors
  const constructors_dict = cachedJsonData.Constructors;

  // Current team info
  const current_team = cachedJsonData.CurrentTeam;

  // Determine free transfers and budget based on selected chip
  let freeTransfers = current_team.freeTransfers;
  const teamBudget = calculateTeamBudget(
    current_team,
    drivers_dict,
    constructors_dict
  );
  let budget = teamBudget.overallBudget;

  switch (selectedChip) {
    case WILDCARD_CHIP:
      freeTransfers = 7;
      break;
    case LIMITLESS_CHIP:
      freeTransfers = 7;
      budget = 999;
      break;
  }

  // Helper function: Generate all combinations of k elements from an array
  function combinations(arr, k) {
    const result = [];
    function helper(start, combo) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return result;
  }

  const driverKeys = Object.keys(drivers_dict);
  const consKeys = Object.keys(constructors_dict);

  const driverCombos = combinations(driverKeys, 5);
  const consCombos = combinations(consKeys, 2);

  const teams = [];

  // Convert current team arrays to Sets for efficient membership tests
  const currentDriversSet = new Set(current_team.drivers);
  const currentConstructorsSet = new Set(current_team.constructors);

  // Iterate over all combinations: 5 drivers and 2 constructors
  for (const driverCombo of driverCombos) {
    // Calculate total price, points, and expected price change for drivers
    const driver_prices = driverCombo.reduce(
      (sum, dr) => sum + drivers_dict[dr].price,
      0
    );
    const driver_points_sum = driverCombo.reduce(
      (sum, dr) => sum + drivers_dict[dr].expectedPoints,
      0
    );
    const driver_price_change = driverCombo.reduce(
      (sum, dr) => sum + drivers_dict[dr].expectedPriceChange,
      0
    );

    // Determine best candidate for DRS (highest expected points)
    let drs_driver = driverCombo[0];
    for (const dr of driverCombo) {
      if (
        drivers_dict[dr].expectedPoints >
        drivers_dict[drs_driver].expectedPoints
      ) {
        drs_driver = dr;
      }
    }
    const bonus_drs_points = drivers_dict[drs_driver].expectedPoints;
    const total_driver_points = driver_points_sum + bonus_drs_points;

    for (const consCombo of consCombos) {
      // Calculate total price and points for constructors
      const cons_prices = consCombo.reduce(
        (sum, cn) => sum + constructors_dict[cn].price,
        0
      );
      const cons_points = consCombo.reduce(
        (sum, cn) => sum + constructors_dict[cn].expectedPoints,
        0
      );
      const cons_price_change = consCombo.reduce(
        (sum, cn) => sum + constructors_dict[cn].expectedPriceChange,
        0
      );

      const total_price = driver_prices + cons_prices;

      // Check if the team is within the allowed budget
      if (total_price <= budget) {
        // Determine how many transfers are needed (only count players not already in the current team)
        const transfers_drivers = driverCombo.filter(
          (dr) => !currentDriversSet.has(dr)
        ).length;
        const transfers_cons = consCombo.filter(
          (cn) => !currentConstructorsSet.has(cn)
        ).length;
        const transfers_needed = transfers_drivers + transfers_cons;

        // Penalty: transfers beyond freeTransfers incur 10 points each.
        const penalty = Math.max(0, transfers_needed - freeTransfers) * 10;

        // Calculate projected points:
        // (total driver points with DRS bonus) + (total constructors points) - penalty.
        const projected_points = total_driver_points + cons_points - penalty;

        // Sum expected price change for the entire team
        const total_price_change = driver_price_change + cons_price_change;

        teams.push({
          drivers: driverCombo,
          constructors: consCombo,
          drs_driver: drs_driver,
          total_price: total_price,
          transfers_needed: transfers_needed,
          penalty: penalty,
          projected_points: projected_points,
          expected_price_change: total_price_change,
        });
      }
    }
  }

  // Sort the teams by projected points in descending order and select the top 20
  teams.sort((a, b) => b.projected_points - a.projected_points);
  const top_teams = teams.slice(0, 20);

  // If LIMITLESS_CHIP is selected, set expected_price_change to current team's expected price change
  if (selectedChip === LIMITLESS_CHIP) {
    const currentDrivers = current_team.drivers;
    const currentConstructors = current_team.constructors;
    const currentDriversPriceChange = currentDrivers.reduce(
      (sum, dr) => sum + drivers_dict[dr].expectedPriceChange,
      0
    );
    const currentConstructorsPriceChange = currentConstructors.reduce(
      (sum, cn) => sum + constructors_dict[cn].expectedPriceChange,
      0
    );
    const currentTeamPriceChange =
      currentDriversPriceChange + currentConstructorsPriceChange;
    top_teams.forEach((team) => {
      team.expected_price_change = currentTeamPriceChange;
    });
  }

  // Add a row number to each team and rearrange the output fields
  const finalTeams = top_teams.map((team, index) => ({
    row: index + 1,
    drivers: team.drivers,
    constructors: team.constructors,
    drs_driver: team.drs_driver,
    total_price: team.total_price,
    transfers_needed: team.transfers_needed,
    penalty: team.penalty,
    projected_points: team.projected_points,
    expected_price_change: team.expected_price_change,
  }));

  return finalTeams;
};

exports.calculateChangesToTeam = function (
  cachedJsonData,
  targetTeam,
  selectedChip
) {
  const currentTeam = cachedJsonData.CurrentTeam;

  // Determine drivers that need to be added and removed
  const driversToAdd = targetTeam.drivers.filter(
    (driver) => !currentTeam.drivers.includes(driver)
  );
  const driversToRemove = currentTeam.drivers.filter(
    (driver) => !targetTeam.drivers.includes(driver)
  );

  // Determine constructors that need to be added and removed
  const constructorsToAdd = targetTeam.constructors.filter(
    (cons) => !currentTeam.constructors.includes(cons)
  );
  const constructorsToRemove = currentTeam.constructors.filter(
    (cons) => !targetTeam.constructors.includes(cons)
  );

  // Calculate DRS driver change:
  const drs_driver_change = currentTeam.drsBoost !== targetTeam.drs_driver;
  const newDRS = drs_driver_change ? targetTeam.drs_driver : undefined;

  // Handle special chips
  let chipToActivate;
  if (selectedChip === WILDCARD_CHIP) {
    if (targetTeam.transfers_needed > currentTeam.freeTransfers) {
      chipToActivate = WILDCARD_CHIP;
    }
  } else if (selectedChip === LIMITLESS_CHIP) {
    const currentTeamBudget = calculateTeamBudget(
      currentTeam,
      cachedJsonData.Drivers,
      cachedJsonData.Constructors
    );
    if (targetTeam.total_price > currentTeamBudget.overallBudget) {
      chipToActivate = LIMITLESS_CHIP;
    }
  }

  return {
    driversToAdd,
    driversToRemove,
    constructorsToAdd,
    constructorsToRemove,
    newDRS,
    chipToActivate,
  };
};
