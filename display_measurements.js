// Simple script to display architectural measurements from SKSON file
const fs = require('fs');

// Read the detailed analysis file
const analysisData = JSON.parse(fs.readFileSync('./suddeco_detailed_analysis.skson', 'utf8'));

// Extract room details and building analysis
const rooms = analysisData.architectural_analysis.room_details;
const buildingAnalysis = analysisData.architectural_analysis.building_analysis;

// Display building summary
console.log('\n=== SUDDECO ARCHITECTURAL MEASUREMENT REPORT ===\n');
console.log('BUILDING SUMMARY:');
console.log('------------------');
console.log('Total Internal Dimensions:');
console.log(`  Length: ${buildingAnalysis.total_internal_dimensions.length}`);
console.log(`  Width: ${buildingAnalysis.total_internal_dimensions.width}`);
console.log(`  Height: ${buildingAnalysis.total_internal_dimensions.height}`);

console.log('\nTotal External Dimensions:');
console.log(`  Length: ${buildingAnalysis.total_external_dimensions.length}`);
console.log(`  Width: ${buildingAnalysis.total_external_dimensions.width}`);
console.log(`  Height: ${buildingAnalysis.total_external_dimensions.height}`);

console.log('\nTotal Floor Area:');
console.log(`  Internal: ${buildingAnalysis.total_floor_area.internal}`);
console.log(`  External: ${buildingAnalysis.total_floor_area.external}`);

console.log('\nTotal Wall Area:');
console.log(`  Internal: ${buildingAnalysis.total_wall_area.internal}`);
console.log(`  External: ${buildingAnalysis.total_wall_area.external}`);

console.log('\nTotal Ceiling Area:');
console.log(`  ${buildingAnalysis.total_ceiling_area}`);

console.log('\nTotal Volume:');
console.log(`  Internal: ${buildingAnalysis.total_volume.internal}`);
console.log(`  External: ${buildingAnalysis.total_volume.external}`);

// Display room details
console.log('\nROOM DETAILS:');
console.log('-------------');

rooms.forEach(room => {
  console.log(`\n${room.name.toUpperCase()}:`);
  
  console.log('  Internal Dimensions:');
  console.log(`    Length: ${room.internal_dimensions.length}`);
  console.log(`    Width: ${room.internal_dimensions.width}`);
  console.log(`    Height: ${room.internal_dimensions.height}`);
  
  console.log('  External Dimensions:');
  console.log(`    Length: ${room.external_dimensions.length}`);
  console.log(`    Width: ${room.external_dimensions.width}`);
  console.log(`    Height: ${room.external_dimensions.height}`);
  
  console.log('  Floor Area:');
  console.log(`    Internal: ${room.floor_area.internal}`);
  console.log(`    External: ${room.floor_area.external}`);
  
  console.log('  Wall Surface Area:');
  console.log(`    ${room.wall_surface_area}`);
  
  console.log('  Ceiling Area:');
  console.log(`    ${room.ceiling_area}`);
  
  console.log('  Skirting Board Length:');
  console.log(`    ${room.skirting_board_length}`);
});

// Display summary of materials
console.log('\nMATERIALS SUMMARY:');
console.log('-----------------');
const materials = analysisData.materials_quantities;

// Display first few material categories
const materialCategories = Object.keys(materials).slice(0, 3);
materialCategories.forEach(category => {
  console.log(`\n${category.toUpperCase()}:`);
  
  if (typeof materials[category] === 'object') {
    Object.keys(materials[category]).forEach(item => {
      const value = materials[category][item];
      console.log(`  ${item}: ${value}`);
    });
  } else {
    console.log(`  ${materials[category]}`);
  }
});

console.log('\n(More materials details available in the SKSON file)');

// Display summary of tasks
console.log('\nCONSTRUCTION TASKS SUMMARY:');
console.log('--------------------------');
const tasks = analysisData.task_breakdown;

// Display first construction stage as example
const firstStage = Object.keys(tasks)[0];
console.log(`\n${firstStage}:`);

tasks[firstStage].slice(0, 2).forEach(task => {
  console.log(`  - ${task.TaskName || task.taskName}: ${task.EstimatedDuration || task.estimatedDuration} days`);
});

console.log('\n(More task details available in the SKSON file)');
console.log('\n=== END OF REPORT ===\n');
