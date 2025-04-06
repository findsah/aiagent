/**
 * Construction Project Planner
 * 
 * This module provides functionality to generate detailed construction task breakdowns
 * based on architectural analysis and materials quantities.
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI with the provided API key
const openai = new OpenAI({
  apiKey: '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'
});

/**
 * Generate a detailed construction task breakdown based on architectural analysis and materials quantities
 * @param {Object} architecturalAnalysis - The architectural analysis data
 * @param {Object} materialsQuantities - The materials quantities data
 * @returns {Promise<Object>} - A detailed construction task breakdown
 */
async function generateConstructionTaskBreakdown(architecturalAnalysis, materialsQuantities) {
  try {
    console.log('Generating construction task breakdown...');
    
    // Prepare the prompt for the AI
    const prompt = `You are an AI specialized in construction project planning.
    Based on the architectural analysis and materials quantities, create a comprehensive task breakdown for construction.
    
    For each construction stage, provide detailed tasks including:
    1. Task ID and name
    2. Construction stage
    3. Detailed description
    4. Estimated duration (days)
    5. Required labor (person-days and specific trades)
    6. Dependencies (which tasks must be completed first)
    7. Materials used (with quantities)
    8. Quality control requirements
    9. Room/location specific details
    
    Organize tasks by construction stage following industry standard sequencing.
    Format your response as a detailed JSON object following construction industry standards.`;
    
    // Convert the analysis and materials data to strings for the API call
    const analysisString = JSON.stringify(architecturalAnalysis, null, 2);
    const materialsString = JSON.stringify(materialsQuantities, null, 2);
    
    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Generate a detailed construction task breakdown based on this architectural analysis and materials list:
          Architectural Analysis: ${analysisString}
          Materials Quantities: ${materialsString}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    // Extract and parse the response
    const taskBreakdownText = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let taskBreakdown;
    try {
      // First, try to parse the entire response as JSON
      taskBreakdown = JSON.parse(taskBreakdownText);
    } catch (parseError) {
      // If that fails, try to extract JSON from the text response
      const jsonMatch = taskBreakdownText.match(/```json\n([\s\S]*?)\n```/) || 
                        taskBreakdownText.match(/```\n([\s\S]*?)\n```/) ||
                        taskBreakdownText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        try {
          taskBreakdown = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (innerParseError) {
          console.error('Error parsing extracted JSON:', innerParseError);
          throw new Error('Failed to parse the construction task breakdown response');
        }
      } else {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Failed to parse the construction task breakdown response');
      }
    }
    
    // Save the task breakdown to a file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const outputPath = path.join(outputDir, `construction_task_breakdown_${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(taskBreakdown, null, 2));
    
    console.log(`Construction task breakdown saved to: ${outputPath}`);
    
    return {
      taskBreakdown,
      outputPath
    };
  } catch (error) {
    console.error('Error generating construction task breakdown:', error);
    throw error;
  }
}

/**
 * Calculate estimated project timeline based on task breakdown
 * @param {Object} taskBreakdown - The construction task breakdown
 * @returns {Object} - Project timeline information
 */
function calculateProjectTimeline(taskBreakdown) {
  try {
    // Extract tasks from the breakdown
    const allTasks = [];
    
    // Handle different task breakdown structures
    if (taskBreakdown.constructionStages) {
      // If organized by construction stages
      taskBreakdown.constructionStages.forEach(stage => {
        if (stage.tasks) {
          stage.tasks.forEach(task => {
            allTasks.push({
              id: task.taskId,
              name: task.taskName,
              stage: stage.stageName,
              duration: parseFloat(task.estimatedDuration.replace('days', '').trim()),
              dependencies: task.dependencies || []
            });
          });
        }
      });
    } else if (taskBreakdown.tasks) {
      // If organized as a flat list of tasks
      taskBreakdown.tasks.forEach(task => {
        allTasks.push({
          id: task.taskId,
          name: task.taskName,
          stage: task.constructionStage,
          duration: parseFloat(task.estimatedDuration.replace('days', '').trim()),
          dependencies: task.dependencies || []
        });
      });
    }
    
    // Calculate critical path and project duration
    const { criticalPath, projectDuration } = calculateCriticalPath(allTasks);
    
    // Calculate earliest start and finish dates for each task
    const startDate = new Date();
    const taskSchedule = calculateTaskSchedule(allTasks, startDate);
    
    return {
      projectDuration,
      criticalPath,
      estimatedStartDate: startDate.toISOString().split('T')[0],
      estimatedEndDate: new Date(startDate.getTime() + (projectDuration * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      taskSchedule
    };
  } catch (error) {
    console.error('Error calculating project timeline:', error);
    return {
      projectDuration: 0,
      criticalPath: [],
      estimatedStartDate: new Date().toISOString().split('T')[0],
      estimatedEndDate: new Date().toISOString().split('T')[0],
      taskSchedule: []
    };
  }
}

/**
 * Calculate the critical path and project duration
 * @param {Array} tasks - List of all tasks
 * @returns {Object} - Critical path and project duration
 */
function calculateCriticalPath(tasks) {
  // Create a map of tasks by ID for easy lookup
  const taskMap = {};
  tasks.forEach(task => {
    taskMap[task.id] = { ...task, earliestStart: 0, earliestFinish: task.duration };
  });
  
  // Forward pass - Calculate earliest start and finish times
  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      let maxEarliestFinish = 0;
      task.dependencies.forEach(depId => {
        if (taskMap[depId] && taskMap[depId].earliestFinish > maxEarliestFinish) {
          maxEarliestFinish = taskMap[depId].earliestFinish;
        }
      });
      taskMap[task.id].earliestStart = maxEarliestFinish;
      taskMap[task.id].earliestFinish = maxEarliestFinish + task.duration;
    }
  });
  
  // Find the project duration (maximum earliest finish)
  let projectDuration = 0;
  Object.values(taskMap).forEach(task => {
    if (task.earliestFinish > projectDuration) {
      projectDuration = task.earliestFinish;
    }
  });
  
  // Backward pass - Calculate latest start and finish times
  Object.values(taskMap).forEach(task => {
    task.latestFinish = projectDuration;
    task.latestStart = task.latestFinish - task.duration;
  });
  
  tasks.slice().reverse().forEach(task => {
    const dependents = tasks.filter(t => t.dependencies && t.dependencies.includes(task.id));
    if (dependents.length > 0) {
      let minLatestStart = Infinity;
      dependents.forEach(dep => {
        if (taskMap[dep.id] && taskMap[dep.id].latestStart < minLatestStart) {
          minLatestStart = taskMap[dep.id].latestStart;
        }
      });
      taskMap[task.id].latestFinish = minLatestStart;
      taskMap[task.id].latestStart = minLatestStart - task.duration;
    }
  });
  
  // Calculate slack and identify critical path
  const criticalPath = [];
  Object.values(taskMap).forEach(task => {
    task.slack = task.latestStart - task.earliestStart;
    if (task.slack === 0) {
      criticalPath.push(task.id);
    }
  });
  
  return { criticalPath, projectDuration };
}

/**
 * Calculate schedule dates for each task
 * @param {Array} tasks - List of all tasks
 * @param {Date} startDate - Project start date
 * @returns {Array} - Schedule information for each task
 */
function calculateTaskSchedule(tasks, startDate) {
  // Create a map of tasks by ID for easy lookup
  const taskMap = {};
  tasks.forEach(task => {
    taskMap[task.id] = { ...task, earliestStart: 0, earliestFinish: task.duration };
  });
  
  // Forward pass - Calculate earliest start and finish times
  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      let maxEarliestFinish = 0;
      task.dependencies.forEach(depId => {
        if (taskMap[depId] && taskMap[depId].earliestFinish > maxEarliestFinish) {
          maxEarliestFinish = taskMap[depId].earliestFinish;
        }
      });
      taskMap[task.id].earliestStart = maxEarliestFinish;
      taskMap[task.id].earliestFinish = maxEarliestFinish + task.duration;
    }
  });
  
  // Calculate actual dates
  const schedule = [];
  Object.values(taskMap).forEach(task => {
    const startDateObj = new Date(startDate);
    startDateObj.setDate(startDateObj.getDate() + task.earliestStart);
    
    const endDateObj = new Date(startDate);
    endDateObj.setDate(endDateObj.getDate() + task.earliestFinish);
    
    schedule.push({
      taskId: task.id,
      taskName: task.name,
      stage: task.stage,
      startDate: startDateObj.toISOString().split('T')[0],
      endDate: endDateObj.toISOString().split('T')[0],
      duration: task.duration
    });
  });
  
  return schedule;
}

/**
 * Generate a Gantt chart data structure for visualization
 * @param {Object} taskBreakdown - The construction task breakdown
 * @returns {Object} - Gantt chart data
 */
function generateGanttChartData(taskBreakdown) {
  try {
    const timeline = calculateProjectTimeline(taskBreakdown);
    
    // Format the data for a Gantt chart
    const ganttData = {
      tasks: timeline.taskSchedule.map(task => ({
        id: task.taskId,
        name: task.taskName,
        start: task.startDate,
        end: task.endDate,
        progress: 0,
        dependencies: taskBreakdown.tasks.find(t => t.taskId === task.taskId)?.dependencies || [],
        stage: task.stage,
        isCritical: timeline.criticalPath.includes(task.taskId)
      })),
      projectDuration: timeline.projectDuration,
      startDate: timeline.estimatedStartDate,
      endDate: timeline.estimatedEndDate
    };
    
    return ganttData;
  } catch (error) {
    console.error('Error generating Gantt chart data:', error);
    return { tasks: [], projectDuration: 0, startDate: '', endDate: '' };
  }
}

module.exports = {
  generateConstructionTaskBreakdown,
  calculateProjectTimeline,
  generateGanttChartData
};
