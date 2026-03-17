(function attachInkOsV3Mock() {
  function action(actionId, type, label, extra) {
    return Object.assign({ actionId, type, label }, extra || {});
  }

  function tool(toolEventId, runId, toolName, previewPayload, extra) {
    return Object.assign(
      {
        toolEventId,
        runId,
        toolName,
        toolSchemaVersion: "1.0.0",
        previewPayload,
        actions: [],
        skillId: toolName.split(".")[0],
        skillVersion: "0.3.0"
      },
      extra || {}
    );
  }

  function draft(draftId, type, bookId, status, revision, preview, extra) {
    return Object.assign(
      {
        draftId,
        type,
        bookId,
        status,
        revision,
        sourceThreadId: "thread_material_character",
        sourceRunId: "run_material_303",
        skillRef: {
          skillId: "material-generator",
          skillVersion: "0.3.0",
          skillHash: "9a81d6b3c2ef",
          source: "project"
        },
        toolSchemaVersion: "1.0.0",
        preview,
        artifactSnapshotRefs: [],
        etag: `W/"${revision}"`,
        createdAt: "2026-03-16T09:14:00+08:00",
        updatedAt: "2026-03-16T09:18:00+08:00"
      },
      extra || {}
    );
  }

  var books = [
    {
      id: "book_001",
      title: "吞天魔帝",
      genre: "玄幻",
      phase: "第二卷推进",
      riskTone: "danger",
      riskLabel: "第12章审计失败",
      progressLabel: "13 / 240 章",
      wordsLabel: "31.2 万字",
      currentChapter: 13,
      targetChapter: 240,
      owner: "chief",
      nextAction: "先处理第12章审计，再续写第13章。",
      summary: "旧宗门复辟线已经抬头，角色与 truth 一致性都在临界点。",
      metrics: { materials: 17, truthIssues: 2, pendingDrafts: 3 },
      chapters: [
        { no: 11, title: "风雪封山", status: "通过", note: "已归档，可作为连续性基线。" },
        { no: 12, title: "旧钟鸣", status: "待诊断", note: "审计指出人物位置和阵纹触发时序冲突。" },
        { no: 13, title: "夜入断崖", status: "待续写", note: "目标是把师徒矛盾和旧宗门暗线接上。" }
      ],
      truthFiles: [
        { id: "story_bible.md", label: "story_bible.md", category: "世界观", note: "卷二宗门法统规则已冻结。" },
        { id: "current_state.md", label: "current_state.md", category: "运行态", note: "角色位置和阵纹状态需校正。" },
        { id: "timeline.md", label: "timeline.md", category: "时序", note: "第12章时间线与 audit 结果冲突。" },
        { id: "open_loops.md", label: "open_loops.md", category: "伏笔", note: "旧宗门复辟派相关伏笔未闭环。" },
        { id: "power_system.md", label: "power_system.md", category: "规则", note: "封印阵纹触发边界要回看。" },
        { id: "character_state.md", label: "character_state.md", category: "角色", note: "师徒关系 tension 已提升。" },
        { id: "location_state.md", label: "location_state.md", category: "地点", note: "断崖位置已被第13章预占。" }
      ],
      materials: [
        {
          id: "mat_char_peijin",
          type: "character",
          name: "裴烬",
          status: "draft",
          source: "run_material_303",
          provenance: "thread_material_character / chief",
          note: "旧宗门复辟线的主反派候选。"
        },
        {
          id: "mat_faction_oldorder",
          type: "faction",
          name: "旧宗门复辟派",
          status: "draft",
          source: "run_material_303",
          provenance: "run_material_303",
          note: "适合作为卷二底盘势力。"
        },
        {
          id: "mat_loc_duanya",
          type: "location",
          name: "万坠断崖",
          status: "applied",
          source: "run_truth_091",
          provenance: "materials_summary.md",
          note: "卷二关键交锋地点。"
        }
      ]
    },
    {
      id: "book_002",
      title: "焚星录",
      genre: "玄幻",
      phase: "卷一收束",
      riskTone: "warning",
      riskLabel: "素材待确认",
      progressLabel: "8 / 180 章",
      wordsLabel: "11.8 万字",
      currentChapter: 8,
      targetChapter: 180,
      owner: "chief",
      nextAction: "决定新对手的角色草案，然后刷新 materials_summary。",
      summary: "试炼终章临近，设定冲突不高，但角色对位还不够狠。",
      metrics: { materials: 9, truthIssues: 0, pendingDrafts: 1 },
      chapters: [
        { no: 7, title: "火种试台", status: "通过", note: "资源争夺段落已完成。" },
        { no: 8, title: "灰烬问心", status: "待续写", note: "需要把竞争对手压上来。" }
      ],
      truthFiles: [
        { id: "story_bible.md", label: "story_bible.md", category: "世界观", note: "试炼规则已稳定。" },
        { id: "current_state.md", label: "current_state.md", category: "运行态", note: "暂无 drift。" },
        { id: "timeline.md", label: "timeline.md", category: "时序", note: "卷一进度正常。" },
        { id: "open_loops.md", label: "open_loops.md", category: "伏笔", note: "试炼外世界仍为空。" },
        { id: "power_system.md", label: "power_system.md", category: "规则", note: "火种阶梯边界已写入。" },
        { id: "character_state.md", label: "character_state.md", category: "角色", note: "主角与黎槿对位未建立。" },
        { id: "location_state.md", label: "location_state.md", category: "地点", note: "熔炉试台为主场。" }
      ],
      materials: [
        {
          id: "mat_char_lijin",
          type: "character",
          name: "黎槿",
          status: "draft",
          source: "run_book2_018",
          provenance: "quick chat",
          note: "卷一末段竞争对手。"
        }
      ]
    },
    {
      id: "book_003",
      title: "折月长歌",
      genre: "仙侠",
      phase: "设定清理",
      riskTone: "active",
      riskLabel: "可继续推进",
      progressLabel: "4 / 220 章",
      wordsLabel: "6.9 万字",
      currentChapter: 4,
      targetChapter: 220,
      owner: "chief",
      nextAction: "真相文件已稳定，可以重新开写。",
      summary: "目前处于低风险窗口，适合补章节储备。",
      metrics: { materials: 6, truthIssues: 1, pendingDrafts: 0 },
      chapters: [
        { no: 4, title: "月下回潮", status: "待续写", note: "情感线与势力线都可向前推进。" }
      ],
      truthFiles: [
        { id: "story_bible.md", label: "story_bible.md", category: "世界观", note: "仙门生态已经冻结。" },
        { id: "current_state.md", label: "current_state.md", category: "运行态", note: "一处地点状态滞后。" },
        { id: "timeline.md", label: "timeline.md", category: "时序", note: "章节时间线稳定。" },
        { id: "open_loops.md", label: "open_loops.md", category: "伏笔", note: "仍有两条未接回。" },
        { id: "power_system.md", label: "power_system.md", category: "规则", note: "修炼层级无冲突。" },
        { id: "character_state.md", label: "character_state.md", category: "角色", note: "主配角关系稳定。" },
        { id: "location_state.md", label: "location_state.md", category: "地点", note: "潮生台一处地标待更新。" }
      ],
      materials: []
    }
  ];

  var drafts = [
    draft("draft_character_18", "character", "book_001", "draft", 3, {
      title: "裴烬",
      archetype: "旧宗门复辟线主反派",
      fit: "能贯穿第二卷到第三卷，兼容宗门法统与师徒冲突。",
      anchors: ["旧宗门复位派", "断崖遗址", "借主角破封"],
      comparison: "比强压型反派更能持续施压。"
    }),
    draft("draft_faction_31", "faction", "book_001", "draft", 2, {
      title: "旧宗门复辟派",
      archetype: "法统复位势力",
      fit: "可直接挂到卷二底盘冲突。 ",
      anchors: ["宗门旧部", "合法性叙事", "资源回流"]
    }, { sourceThreadId: "thread_material_character" }),
    draft("draft_location_41", "location", "book_001", "applied", 1, {
      title: "万坠断崖",
      archetype: "关键地点",
      fit: "适合作为卷二交锋第一现场。",
      anchors: ["残碑", "断崖", "旧宗门前厅"]
    }, { sourceThreadId: "thread_truth_sync", sourceRunId: "run_truth_091" }),
    draft("draft_fenxing_char_1", "character", "book_002", "draft", 1, {
      title: "黎槿",
      archetype: "卷一末段竞争对手",
      fit: "擅长抢资源位，能逼主角在规则边缘让步。",
      anchors: ["试炼旁支", "资源操盘", "卷二可延续"]
    }, { sourceThreadId: "thread_book2_materials", sourceRunId: "run_book2_018" })
  ];

  var runs = {
    run_create_book_201: {
      runId: "run_create_book_201",
      threadId: "thread_create_book",
      startedAt: "2026-03-16T09:24:00+08:00",
      stepCount: 2,
      estimatedDuration: 18,
      status: "planning",
      currentStepId: "confirm_plan",
      eventCursor: 12,
      lastPersistedAt: "2026-03-16T09:24:09+08:00",
      skillsLocked: {
        chief: {
          skillId: "chief",
          skillVersion: "0.3.0",
          skillHash: "8cd31a44f201",
          source: "project"
        }
      },
      summary: "已经收集到题材、字数和目标读者，等待确认建书计划。",
      toolPresentations: [
        tool("tool_create_book_plan", "run_create_book_201", "chief.plan", {
          goal: "建立《霜烬列国》的基础工程结构",
          steps: [
            "校验书名、题材、总字数等必填项",
            "生成项目目录、默认 truth files 和 materials_summary",
            "写入 book manifest 并回到书籍总览"
          ],
          note: "这是单线程建书，但需要至少两步工具调用，所以必须在 /chief 完成。"
        }, {
          actions: [
            action("confirm_create_book", "approve", "确认建书"),
            action("edit_create_book", "edit", "修改参数"),
            action("goto_books_after_create", "navigate", "查看书籍列表", {
              navigateTo: "/books"
            })
          ]
        })
      ]
    },
    run_create_book_failed_202: {
      runId: "run_create_book_failed_202",
      threadId: "thread_create_book_failed",
      startedAt: "2026-03-16T08:52:00+08:00",
      stepCount: 2,
      estimatedDuration: 19,
      status: "failed",
      currentStepId: "persist_manifest",
      eventCursor: 9,
      endedAt: "2026-03-16T08:52:19+08:00",
      lastPersistedAt: "2026-03-16T08:52:19+08:00",
      skillsLocked: {
        chief: {
          skillId: "chief",
          skillVersion: "0.3.0",
          skillHash: "8cd31a44f201",
          source: "project"
        }
      },
      error: {
        code: "BOOK_NAME_CONFLICT",
        message: "书名与现有项目 manifest 冲突，无法直接创建。",
        stepId: "persist_manifest",
        retryable: true
      },
      summary: "建书在写入 manifest 时失败，需要修改书名或重试。",
      toolPresentations: [
        tool("tool_create_book_failed", "run_create_book_failed_202", "chief.error-card", {
          title: "建书失败",
          detail: "《霜烬列国》已存在同名 manifest，请修改书名后重试。",
          errorCode: "BOOK_NAME_CONFLICT"
        }, {
          actions: [
            action("retry_create_book_failed", "retry", "修改后重试"),
            action("cancel_create_book_failed", "cancel", "取消这次建书"),
            action("goto_books_after_failed_create", "navigate", "查看书籍列表", {
              navigateTo: "/books"
            })
          ]
        })
      ]
    },
    run_write_301: {
      runId: "run_write_301",
      threadId: "thread_write_ch13",
      startedAt: "2026-03-16T09:26:00+08:00",
      stepCount: 3,
      estimatedDuration: 96,
      status: "awaiting_approval",
      currentStepId: "auditing",
      eventCursor: 41,
      pendingApprovalId: "approval_write_301",
      lastPersistedAt: "2026-03-16T09:28:05+08:00",
      skillsLocked: {
        chief: {
          skillId: "chief",
          skillVersion: "0.3.0",
          skillHash: "8cd31a44f201",
          source: "project"
        },
        writer: {
          skillId: "writer",
          skillVersion: "0.3.0",
          skillHash: "4fdd97a62ba1",
          source: "project"
        }
      },
      summary: "写作草稿已完成，审计发现人物位置与阵纹触发顺序冲突，需要审批后继续修订。",
      toolPresentations: [
        tool("tool_write_plan", "run_write_301", "chief.plan", {
          goal: "继续写《吞天魔帝》第13章，强化师徒矛盾",
          steps: [
            "拉取第12章审计结果与 current_state",
            "写第13章首稿，保留旧宗门复位暗线",
            "审计后按失败点局部修订"
          ],
          note: "server 在 run_started 中声明 stepCount=3 和 estimatedDuration=96s，所以必须升级到 /chief。"
        }),
        tool("tool_worker_trace", "run_write_301", "chief.worker-trace", {
          progress: 66,
          checkpoints: [
            { label: "planning", status: "done" },
            { label: "writing", status: "done" },
            { label: "auditing", status: "active" },
            { label: "revising", status: "queued" }
          ],
          liveNotes: [
            "writer 已输出 4,800 字草稿",
            "auditor 标出人物位置和阵纹时序冲突",
            "revise step 正等待审批"
          ]
        }, {
          actions: [
            action("cancel_run_write_301", "cancel", "取消执行", {
              confirmRequired: true,
              riskLevel: "medium"
            })
          ]
        }),
        tool("tool_approval_request", "run_write_301", "chief.approval-request", {
          title: "批准进入局部修订",
          riskLevel: "medium",
          blockedBy: "审计要求修改第12章结尾两处事实表述，再继续第13章。",
          impact: "会回写章节草稿和 current_state 快照。"
        }, {
          actions: [
            action("approve_run_write_301", "approve", "批准修订"),
            action("reject_run_write_301", "reject", "先人工查看"),
            action("goto_ch12", "navigate", "查看第12章正文", {
              navigateTo: "/books/book_001/chapters/12"
            })
          ]
        })
      ]
    },
    run_audit_302: {
      runId: "run_audit_302",
      threadId: "thread_audit_ch12",
      startedAt: "2026-03-16T09:08:00+08:00",
      stepCount: 1,
      estimatedDuration: 14,
      status: "completed",
      currentStepId: "completed",
      eventCursor: 19,
      endedAt: "2026-03-16T09:08:14+08:00",
      lastPersistedAt: "2026-03-16T09:08:14+08:00",
      skillsLocked: {
        auditor: {
          skillId: "auditor",
          skillVersion: "0.3.0",
          skillHash: "57ad884b9e12",
          source: "project"
        }
      },
      summary: "已给出审计失败的结构化说明和修订建议。",
      toolPresentations: [
        tool("tool_audit_report", "run_audit_302", "chapter.audit-report", {
          severity: "high",
          failedChecks: [
            "current_state.md 中主角位置仍在宗门山门，不应已到断崖前厅",
            "封印阵纹的完全启动早于 truth 记录的触发条件"
          ],
          recommendations: [
            "先把第12章结尾位置描述收束为“离山门未远”",
            "把阵纹改成“半启动”并留到第13章再完成触发"
          ]
        }, {
          actions: [
            action("start_revision_from_audit", "navigate", "一键进入修订流", {
              navigateTo: "/chief?book=book_001&thread=thread_write_ch13"
            }),
            action("open_ch12_from_audit", "navigate", "查看章节详情", {
              navigateTo: "/books/book_001/chapters/12"
            })
          ]
        })
      ]
    },
    run_material_303: {
      runId: "run_material_303",
      threadId: "thread_material_character",
      startedAt: "2026-03-16T09:17:00+08:00",
      stepCount: 1,
      estimatedDuration: 12,
      status: "completed",
      currentStepId: "candidate_generated",
      endedAt: "2026-03-16T09:17:12+08:00",
      eventCursor: 17,
      lastPersistedAt: "2026-03-16T09:17:12+08:00",
      skillsLocked: {
        material_generator: {
          skillId: "material-generator",
          skillVersion: "0.3.0",
          skillHash: "9a81d6b3c2ef",
          source: "project"
        }
      },
      summary: "角色候选已经生成，等待用户决定是否保存到 materials。",
      toolPresentations: [
        tool("tool_material_form", "run_material_303", "material.request-form", {
          type: "character",
          fields: [
            { label: "角色定位", value: "卷二主反派" },
            { label: "冲突核心", value: "借主角破开旧封印，再反手夺权" },
            { label: "延展目标", value: "至少延伸到第三卷" }
          ]
        }, {
          actions: [
            action("material-submit-form", "submit", "提交参数"),
            action("material-cancel-form", "cancel", "取消表单")
          ]
        }),
        tool("tool_material_result", "run_material_303", "material.table-result", {
          draftId: "draft_character_18",
          title: "裴烬",
          summary: "旧宗门复辟线主反派，善用合法性与旧史逼宫。",
          comparison: [
            "延展性强于暴烈型反派",
            "能同时绑定 faction 与 location"
          ],
          bridge: "保存后将同步更新 materials_summary.md"
        }, {
          actions: [
            action("apply_draft_character_18", "apply", "应用保存"),
            action("regen_draft_character_18", "regenerate", "重写生成"),
            action("edit_draft_character_18", "edit", "编辑表单"),
            action("discard_draft_character_18", "discard", "丢弃草案", {
              confirmRequired: true,
              riskLevel: "medium"
            }),
            action("goto_materials_after_draft", "navigate", "查看素材中心", {
              navigateTo: "/books/book_001/materials"
            })
          ],
          upgradeHint: "chief"
        })
      ]
    },
    run_book2_018: {
      runId: "run_book2_018",
      threadId: "thread_book2_materials",
      startedAt: "2026-03-16T09:11:00+08:00",
      stepCount: 1,
      estimatedDuration: 10,
      status: "completed",
      currentStepId: "candidate_generated",
      endedAt: "2026-03-16T09:11:10+08:00",
      eventCursor: 14,
      lastPersistedAt: "2026-03-16T09:11:10+08:00",
      skillsLocked: {
        material_generator: {
          skillId: "material-generator",
          skillVersion: "0.3.0",
          skillHash: "9a81d6b3c2ef",
          source: "project"
        }
      },
      summary: "《焚星录》的竞争对手候选已经生成，等待是否写入 materials。",
      toolPresentations: [
        tool("tool_book2_material_result", "run_book2_018", "material.table-result", {
          draftId: "draft_fenxing_char_1",
          title: "黎槿",
          summary: "卷一末段竞争对手，擅长抢资源位并迫使主角冒险越线。",
          comparison: [
            "比单纯的试炼对手更利于延续到卷二",
            "可以直接绑定资源争夺与人物对位"
          ],
          bridge: "保存后会同步刷新《焚星录》的 materials_summary.md"
        }, {
          actions: [
            action("apply_draft_fenxing_char_1", "apply", "应用保存"),
            action("regen_draft_fenxing_char_1", "regenerate", "重写生成"),
            action("edit_draft_fenxing_char_1", "edit", "编辑表单"),
            action("discard_draft_fenxing_char_1", "discard", "丢弃草案", {
              confirmRequired: true,
              riskLevel: "medium"
            }),
            action("goto_materials_book2", "navigate", "查看素材中心", {
              navigateTo: "/books/book_002/materials"
            })
          ],
          upgradeHint: "chief"
        })
      ]
    },
    run_book3_021: {
      runId: "run_book3_021",
      threadId: "thread_book3_resume",
      startedAt: "2026-03-16T08:58:00+08:00",
      stepCount: 2,
      estimatedDuration: 42,
      status: "planning",
      currentStepId: "confirm_resume_plan",
      eventCursor: 11,
      lastPersistedAt: "2026-03-16T08:58:08+08:00",
      skillsLocked: {
        chief: {
          skillId: "chief",
          skillVersion: "0.3.0",
          skillHash: "8cd31a44f201",
          source: "project"
        },
        writer: {
          skillId: "writer",
          skillVersion: "0.3.0",
          skillHash: "4fdd97a62ba1",
          source: "project"
        }
      },
      summary: "《折月长歌》第4章已具备继续推进条件，等待确认恢复写作。",
      toolPresentations: [
        tool("tool_book3_resume_plan", "run_book3_021", "chief.plan", {
          goal: "恢复《折月长歌》第4章写作并清理最后一处 drift",
          steps: [
            "复核 current_state 与 location_state 的最后一处偏差",
            "续写第4章并把情感线往前推进"
          ],
          note: "这是一个两步 run，确认后会继续在 /chief 中跟踪。"
        }, {
          actions: [
            action("confirm_book3_resume", "approve", "确认恢复写作"),
            action("edit_book3_resume", "edit", "修改方向"),
            action("goto_book3_ch4", "navigate", "查看第4章", {
              navigateTo: "/books/book_003/chapters/4"
            })
          ]
        })
      ]
    }
  };

  window.inkosV3Mock = {
    meta: {
      version: "v3",
      generatedAt: "2026-03-16T09:30:00+08:00"
    },
    connection: {
      state: "connected",
      transport: "ws://127.0.0.1:4100/ws",
      retryIn: 4
    },
    ui: {
      activeBookId: "book_001",
      selectedThreadId: "thread_write_ch13",
      selectedTruthFileId: "current_state.md",
      selectedMaterialType: "character",
      settingsSection: "llm",
      modalOpen: false,
      modalMode: "quick",
      mobilePage: "dashboard"
    },
    dashboard: {
      hero: {
        title: "先诊断《吞天魔帝》第12章，再决定是否继续第13章",
        note: "这是当前回报最高也最能避免返工的动作。"
      },
      todos: [
        { title: "批准第13章局部修订", owner: "/chief", note: "step 3 / revising 正等待审批" },
        { title: "确认裴烬是否写入 materials", owner: "/books/book_001/materials", note: "角色候选已生成" },
        { title: "复核折月长歌的 current_state", owner: "/books/book_003/truth", note: "仍有 1 处 drift" }
      ],
      activity: [
        { when: "刚刚", title: "run_write_301 进入 awaiting_approval", tone: "warning" },
        { when: "09:18", title: "draft_character_18 生成完成", tone: "active" },
        { when: "08:42", title: "daemon 完成今日第 14 次巡检", tone: "success" }
      ]
    },
    books: books,
    drafts: drafts,
    chief: {
      threads: [
        {
          threadId: "thread_create_book",
          title: "新建《霜烬列国》",
          scope: "global",
          lastRunId: "run_create_book_201",
          lastMessageAt: "2026-03-16T09:24:08+08:00",
          archived: false,
          createdAt: "2026-03-16T09:23:40+08:00",
          status: "awaiting_user_action",
          updatedAt: "刚刚",
          summary: "多步补信息与建书确认必须留在 /chief。",
          messages: [
            { role: "user", text: "帮我建一本玄幻小说，偏王朝争霸，但视角不要太大。" },
            { role: "assistant", text: "可以。我先收集书名、目标字数和读者方向，然后在主线程里给你确认建书计划。" }
          ]
        },
        {
          threadId: "thread_create_book_failed",
          title: "建书失败回看",
          scope: "global",
          lastRunId: "run_create_book_failed_202",
          lastMessageAt: "2026-03-16T08:52:19+08:00",
          archived: false,
          createdAt: "2026-03-16T08:51:40+08:00",
          status: "failed",
          updatedAt: "36 分钟前",
          summary: "失败卡需要支持重试、取消和查看详情。",
          messages: [
            { role: "user", text: "帮我建一本叫《霜烬列国》的书。" },
            { role: "assistant", text: "建书在 manifest 写入阶段失败了，我把错误原因和重试入口整理成错误卡。" }
          ]
        },
        {
          threadId: "thread_write_ch13",
          title: "继续写《吞天魔帝》第13章",
          scope: "book",
          bookId: "book_001",
          lastRunId: "run_write_301",
          lastMessageAt: "2026-03-16T09:28:05+08:00",
          archived: false,
          createdAt: "2026-03-16T09:25:10+08:00",
          status: "awaiting_approval",
          updatedAt: "2 分钟前",
          summary: "写作、审计、修订三步都在主线程中追踪。",
          messages: [
            { role: "user", text: "写下一章，重点写师徒矛盾，但别把旧宗门暗线丢掉。" },
            { role: "assistant", text: "已绑定《吞天魔帝》并拆成 planning → writing → auditing → revising。下面是计划和当前执行轨迹。" }
          ]
        },
        {
          threadId: "thread_audit_ch12",
          title: "诊断第12章审计失败",
          scope: "chapter",
          bookId: "book_001",
          chapterNumber: 12,
          lastRunId: "run_audit_302",
          lastMessageAt: "2026-03-16T09:08:14+08:00",
          archived: false,
          createdAt: "2026-03-16T09:07:40+08:00",
          status: "completed",
          updatedAt: "12 分钟前",
          summary: "结构化摘要在 /chief，看长文跳章节页。",
          messages: [
            { role: "user", text: "第12章审计为什么没过？" },
            { role: "assistant", text: "我把失败点压缩成结构化摘要卡；如果你要读长文和 diff，再跳章节页。" }
          ]
        },
        {
          threadId: "thread_material_character",
          title: "生成反派角色候选",
          scope: "quick",
          bookId: "book_001",
          lastRunId: "run_material_303",
          lastMessageAt: "2026-03-16T09:17:12+08:00",
          archived: false,
          createdAt: "2026-03-16T09:16:40+08:00",
          status: "awaiting_user_action",
          updatedAt: "18 分钟前",
          summary: "本来可在 chat 完成，但当前 action 超过 2 个，server 已提示升级。",
          messages: [
            { role: "user", text: "帮我做一个卷二主反派，最好能延伸到第三卷。" },
            { role: "assistant", text: "参数已经补齐。因为当前候选需要比较、编辑、重写和保存，server 已把这轮结果升级到 /chief。" }
          ]
        },
        {
          threadId: "thread_book2_materials",
          title: "焚星录 · 竞争对手设定",
          scope: "book",
          bookId: "book_002",
          lastRunId: "run_book2_018",
          lastMessageAt: "2026-03-16T09:11:10+08:00",
          archived: false,
          createdAt: "2026-03-16T09:10:40+08:00",
          status: "awaiting_user_action",
          updatedAt: "19 分钟前",
          summary: "竞争对手候选已生成，等待决定是否保存进 materials。",
          messages: [
            { role: "user", text: "给《焚星录》做一个能压住主角的竞争对手。" },
            { role: "assistant", text: "我先给出一个可延续到卷二的候选，下面直接看结构化结果。" }
          ]
        },
        {
          threadId: "thread_book3_resume",
          title: "折月长歌 · 恢复第4章写作",
          scope: "book",
          bookId: "book_003",
          lastRunId: "run_book3_021",
          lastMessageAt: "2026-03-16T08:58:08+08:00",
          archived: false,
          createdAt: "2026-03-16T08:57:44+08:00",
          status: "awaiting_user_action",
          updatedAt: "32 分钟前",
          summary: "drift 已收敛到最后一处，确认后即可恢复当前章节写作。",
          messages: [
            { role: "user", text: "这本现在能继续写了吗？" },
            { role: "assistant", text: "可以。我把恢复写作前要确认的两步整理成计划，确认后就能推进。" }
          ]
        }
      ],
      runs: runs
    },
    automation: {
      daemon: {
        state: "running",
        workers: "2 / 4",
        nextInspection: "09:40",
        writeCron: "0 */2 * * *",
        inspectCron: "15 */6 * * *"
      },
      queue: [
        { id: "job_913", scope: "焚星录 / materials", task: "summary_refresh", state: "running", note: "同步 materials_summary.md" },
        { id: "job_914", scope: "吞天魔帝 / chapter-13", task: "resume_after_approval", state: "blocked", note: "等待 chief 审批" }
      ],
      history: [
        { id: "job_905", scope: "折月长歌 / truth", task: "truth_sync", state: "done", note: "修正地点状态" },
        { id: "job_904", scope: "全项目", task: "night_inspection", state: "done", note: "发现 2 个 drift" }
      ],
      logs: [
        "[09:18] run_material_303 presented material.table-result",
        "[09:22] run_write_301 awaiting approval",
        "[09:28] daemon night inspection done"
      ]
    },
    settings: {
      sections: [
        { id: "llm", label: "LLM 路由" },
        { id: "notifications", label: "通知策略" },
        { id: "skills", label: "Skill 管理" },
        { id: "advanced", label: "高级选项" }
      ],
      llm: {
        chief: "gpt-5.4",
        writer: "gpt-5.3-codex",
        auditor: "gpt-5.2"
      },
      notifications: {
        desktop: "开启",
        highRisk: "立即提醒",
        dailyDigest: "每天 19:00"
      },
      skills: [
        { id: "material-generator", label: "Material Generator", track: "stable", note: "character / faction / location 已冻结" },
        { id: "truth-sync", label: "Truth Sync", track: "stable", note: "绑定 7 个 truth files" },
        { id: "audit-reviser", label: "Audit Reviser", track: "experimental", note: "只建议局部试点" }
      ],
      advanced: {
        approvalMode: "破坏性动作必须确认",
        dbPath: ".inkos-ui/inkos.db",
        wsEndpoint: "ws://127.0.0.1:4100/ws"
      }
    },
    quickAssist: {
      quick: {
        title: "快速问答",
        description: "这是一个可以留在当前页完成的轻问答示例，不会升级到 /chief。",
        prompt: "今天我先看哪本书最值？",
        reply: "先看《吞天魔帝》。它同时挂着审计失败、待确认素材和续写阻塞，处理收益最高。",
        upgradeRequired: false,
        actions: [
          { label: "关闭弹层", kind: "close" },
          { label: "查看书籍列表", kind: "navigate", route: { page: "books", bookId: "book_001" } }
        ]
      },
      upgrade: {
        title: "快速问答",
        description: "这里只承载单步轻问答；当前这轮 server 已发出 upgradeHint，必须转到 /chief。",
        prompt: "今天最该优先处理哪个动作？",
        reply: "优先处理《吞天魔帝》第12章审计失败。它同时阻断续写和 truth 同步，拖得越久返工越大。",
        upgradeRequired: true,
        actions: [
          { label: "关闭弹层", kind: "close" },
          { label: "升级到 /chief", kind: "navigate", route: { page: "chief", bookId: "book_001", threadId: "thread_write_ch13" } }
        ]
      }
    }
  };
})();
