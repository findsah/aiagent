// Visualization script for architectural measurements
const fs = require('fs');

// Read the detailed analysis file
const analysisData = JSON.parse(fs.readFileSync('./suddeco_detailed_analysis.skson', 'utf8'));

// Extract room details for easier access
const rooms = analysisData.architectural_analysis.room_details;
const buildingAnalysis = analysisData.architectural_analysis.building_analysis;

// Create a formatted report
let report = `
# SUDDECO ARCHITECTURAL MEASUREMENT REPORT
Generated: ${analysisData.generated_at}

## BUILDING SUMMARY
┌───────────────────────────────────────────────────────────────────┐
│ TOTAL BUILDING DIMENSIONS                                         │
├─────────────────────┬─────────────────┬─────────────────┬─────────┤
│                     │     Length      │      Width      │ Height  │
├─────────────────────┼─────────────────┼─────────────────┼─────────┤
│ Internal Dimensions │ ${buildingAnalysis.total_internal_dimensions.length.padEnd(15)} │ ${buildingAnalysis.total_internal_dimensions.width.padEnd(15)} │ ${buildingAnalysis.total_internal_dimensions.height.padEnd(7)} │
│ External Dimensions │ ${buildingAnalysis.total_external_dimensions.length.padEnd(15)} │ ${buildingAnalysis.total_external_dimensions.width.padEnd(15)} │ ${buildingAnalysis.total_external_dimensions.height.padEnd(7)} │
└─────────────────────┴─────────────────┴─────────────────┴─────────┘

┌───────────────────────────────────────────────────────────────────┐
│ TOTAL AREAS                                                       │
├─────────────────────┬─────────────────────────────────────────────┤
│ Internal Floor Area │ ${buildingAnalysis.total_floor_area.internal.padEnd(43)} │
│ External Floor Area │ ${buildingAnalysis.total_floor_area.external.padEnd(43)} │
│ Internal Wall Area  │ ${buildingAnalysis.total_wall_area.internal.padEnd(43)} │
│ External Wall Area  │ ${buildingAnalysis.total_wall_area.external.padEnd(43)} │
│ Total Ceiling Area  │ ${buildingAnalysis.total_ceiling_area.padEnd(43)} │
└─────────────────────┴─────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ TOTAL VOLUME                                                      │
├─────────────────────┬─────────────────────────────────────────────┤
│ Internal Volume     │ ${buildingAnalysis.total_volume.internal.padEnd(43)} │
│ External Volume     │ ${buildingAnalysis.total_volume.external.padEnd(43)} │
└─────────────────────┴─────────────────────────────────────────────┘

## ROOM DETAILS
`;

// Add details for each room
rooms.forEach(room => {
  report += `
┌───────────────────────────────────────────────────────────────────┐
│ ROOM: ${room.name.toUpperCase().padEnd(55)} │
├─────────────────────┬─────────────────┬─────────────────┬─────────┤
│                     │     Length      │      Width      │ Height  │
├─────────────────────┼─────────────────┼─────────────────┼─────────┤
│ Internal Dimensions │ ${room.internal_dimensions.length.padEnd(15)} │ ${room.internal_dimensions.width.padEnd(15)} │ ${room.internal_dimensions.height.padEnd(7)} │
│ External Dimensions │ ${room.external_dimensions.length.padEnd(15)} │ ${room.external_dimensions.width.padEnd(15)} │ ${room.external_dimensions.height.padEnd(7)} │
├─────────────────────┴─────────────────┴─────────────────┴─────────┤
│ AREAS                                                            │
├─────────────────────┬─────────────────────────────────────────────┤
│ Internal Floor Area │ ${room.floor_area.internal.padEnd(43)} │
│ External Floor Area │ ${room.floor_area.external.padEnd(43)} │
│ Wall Surface Area   │ ${room.wall_surface_area.padEnd(43)} │
│ Ceiling Area        │ ${room.ceiling_area.padEnd(43)} │
├─────────────────────┼─────────────────────────────────────────────┤
│ Skirting Length     │ ${room.skirting_board_length.padEnd(43)} │
└─────────────────────┴─────────────────────────────────────────────┘
`;
});

// Add materials section
report += `
## MATERIALS SUMMARY
`;

// Extract key material categories
const materials = analysisData.materials_quantities;
const materialCategories = Object.keys(materials);

materialCategories.forEach(category => {
  report += `
┌───────────────────────────────────────────────────────────────────┐
│ ${category.toUpperCase().padEnd(63)} │
├─────────────────────┬─────────────────────────────────────────────┤
`;

  // Handle different material category structures
  if (typeof materials[category] === 'object') {
    Object.keys(materials[category]).forEach(item => {
      const value = materials[category][item];
      report += `│ ${item.padEnd(19)} │ ${String(value).padEnd(43)} │\n`;
    });
  } else {
    report += `│ Quantity           │ ${String(materials[category]).padEnd(43)} │\n`;
  }
  
  report += `└─────────────────────┴─────────────────────────────────────────────┘\n`;
});

// Write the report to a file
fs.writeFileSync('./suddeco_measurements_report.txt', report);
console.log('Measurement visualization report created: suddeco_measurements_report.txt');
