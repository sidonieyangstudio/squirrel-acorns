/* =========================================================
   松鼠點數收集 · 放學破關模式規則
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquirrelAfterSchool = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const AFTER_SCHOOL_PLAN = [
    {
      id: 'decompress',
      title: '第一段 · 回家卸載',
      time: '3:00–3:30',
      tasks: [
        {
          id: 'snack-clothes',
          title: '吃點心、換衣服',
          note: '先讓身體回到家',
          icon: 'ic-salad',
          points: 1
        }
      ]
    },
    {
      id: 'ticket',
      title: '第二段 · 拿門票',
      time: '3:30–6:45',
      tasks: [
        {
          id: 'chinese-story',
          title: '中文故事 15 分鐘',
          note: '遊戲機門票條件 1/2',
          icon: 'ic-bookopen',
          points: 5,
          ticket: true
        },
        {
          id: 'piano',
          title: '練琴 10 分鐘',
          note: '完成後開遊戲機門票',
          icon: 'ic-piano',
          points: 5,
          ticket: true,
          actionLabel: '開始練琴倒數'
        }
      ]
    },
    {
      id: 'evening',
      title: '第三段 · 晚上收好',
      time: '晚餐後–8:30',
      tasks: [
        {
          id: 'lunchbox',
          title: '準備明天便當',
          note: '晚餐後出現',
          icon: 'ic-backpack',
          points: 2
        },
        {
          id: 'shower',
          title: '洗澡、換睡衣',
          note: '把身體切到睡覺模式',
          icon: 'ic-sparkles',
          points: 2
        },
        {
          id: 'brush-bed',
          title: '刷牙、上床',
          note: '9:00 前開睡前故事',
          icon: 'ic-star',
          points: 3,
          storyGate: true
        }
      ]
    }
  ];

  function flattenTasks(plan = AFTER_SCHOOL_PLAN) {
    return plan.flatMap(phase => phase.tasks.map(task => ({
      ...task,
      phaseId: phase.id,
      phaseTitle: phase.title,
      phaseTime: phase.time
    })));
  }

  function isAfterSchoolDone(log, taskId) {
    return !!(log && log[taskId] && log[taskId].done);
  }

  function setAfterSchoolTaskDone(log, taskId, done, at = Date.now()) {
    const next = { ...(log || {}) };
    if (done) {
      next[taskId] = { done: true, at };
    } else {
      delete next[taskId];
    }
    return next;
  }

  function getAfterSchoolStatus(plan = AFTER_SCHOOL_PLAN, log = {}) {
    const tasks = flattenTasks(plan);
    const doneTasks = tasks.filter(task => isAfterSchoolDone(log, task.id));
    const ticketTasks = tasks.filter(task => task.ticket);
    const ticketDone = ticketTasks.filter(task => isAfterSchoolDone(log, task.id));
    const nextTask = tasks.find(task => !isAfterSchoolDone(log, task.id)) || null;
    const earnedPoints = doneTasks.reduce((sum, task) => sum + (parseInt(task.points, 10) || 0), 0);

    return {
      tasks,
      totalCount: tasks.length,
      doneCount: doneTasks.length,
      earnedPoints,
      nextTask,
      gameTicket: {
        totalCount: ticketTasks.length,
        doneCount: ticketDone.length,
        done: ticketTasks.length > 0 && ticketDone.length === ticketTasks.length
      },
      storyReady: tasks.some(task => task.storyGate && isAfterSchoolDone(log, task.id))
    };
  }

  return {
    AFTER_SCHOOL_PLAN,
    flattenTasks,
    getAfterSchoolStatus,
    isAfterSchoolDone,
    setAfterSchoolTaskDone
  };
});
