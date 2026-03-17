(function () {
  function candidate(id, name, summary, faction, conflict, longevity, tone) {
    return { id, name, summary, faction, conflict, longevity, tone };
  }

  function truthFile(id, title, meta, lines, changes, entities, driftNote) {
    return { id, title, meta, lines, changes, entities, driftNote };
  }

  function libraryItem(id, name, type, status, sourceRunId, updatedAt, summary) {
    return { id, name, type, status, sourceRunId, updatedAt, summary };
  }

  window.inkosPrototypeMockData = {
    meta: {
      version: "v2-mock",
      stateKey: "inkos-prototype-state-v2"
    },
    ui: {
      activeBookId: "book_001",
      dashboard: { sortByRisk: false, onlyActive: true, quickQuery: "今天哪本书最该优先处理？请按收益和风险给我排序。", quickResponseIndex: 0 },
      books: { search: "", filter: "all", sort: "recent", showArchived: false, quickQuery: "如果今天只能推进两本，应该优先哪两本？", quickResponseIndex: 0 },
      bookOverview: { selectedApprovalId: "approval_char_pei_jin", quickQuery: "如果今天只推进一个动作，应该先修第 13 章还是先保存角色草案？", quickResponseIndex: 0 },
      chief: { search: "", selectedThreadId: "thread_book_001_materials", composer: "如果我选裴烬，他和当前主角的长期冲突线还能再拉长到第三卷吗？", quickResponseIndex: 0 },
      chapterWorkbench: { activeTab: "reading", quickQuery: "分析这章失败原因，并告诉我最短修订路径。", revisionApplied: false, quickResponseIndex: 0 },
      truthCenter: { selectedFileId: "current_state.md", activeTab: "document", quickQuery: "这个 truth 和第 13 章的冲突点是什么？", quickResponseIndex: 0 },
      materialsCenter: { selectedType: "character", libraryFilter: "all", quickQuery: "裴烬和另外两位谁更适合第二卷？", quickResponseIndex: 0 },
      automation: { activeTab: "queue", selectedJobId: "job_912", quickQuery: "今天失败最多的模式是什么？", quickResponseIndex: 0 },
      settings: { currentSection: "general", dirty: false, quickQuery: "如果我要提高系统稳定性，先改哪一项设置？", quickResponseIndex: 0 }
    },
    books: [
      {
        id: "book_001",
        title: "吞天魔帝",
        phase: "drafting",
        phaseLabel: "第二卷 drafting",
        active: true,
        archived: false,
        riskTone: "warning",
        riskLabel: "中风险",
        latestAction: "Auditor 失败后待修订",
        lastActivity: "Auditor 失败 12 分钟前",
        lastEditedAt: "08:42",
        chapterCurrent: 13,
        chapterTarget: 40,
        wordCount: 362440,
        truthFilesCount: 7,
        materialsCount: 23,
        pendingDrafts: 2,
        nextAction: {
          title: "先处理第 13 章审计失败，再应用第二卷反派草案",
          body: "第 13 章当前阻断继续写作链路；反派候选是 medium 风险可撤销写入，排在第二优先级。"
        },
        chapterActivity: [
          { chapter: 13, statusTone: "warning", statusLabel: "audit failed", note: "角色动机衔接不足，节奏过快" },
          { chapter: 12, statusTone: "success", statusLabel: "final", note: "truth 已同步，hooks 已更新" },
          { chapter: 11, statusTone: "active", statusLabel: "stable", note: "已锁定在快照 11.3" }
        ],
        healthAlerts: [
          { tone: "warning", title: "第 13 章审计未通过", body: "需要回到章节页查看正文与 audit-report 对照。" },
          { tone: "active", title: "第二卷反派候选待保存", body: "如果今天会继续写后续章节，建议先锁定角色。" }
        ],
        decisions: [
          { title: "保留第 12 章 hooks 结构", body: "Chief 建议不重写，以避免影响第二卷节奏铺垫。", when: "昨天" },
          { title: "冻结宗门支线势力设定", body: "作为后续反派生成时的冲突边界。", when: "前天" }
        ],
        approvals: [
          { id: "approval_char_pei_jin", draftId: "draft_character_18", type: "character", title: "角色：裴烬", summary: "可撤销写入 materials/characters", riskTone: "warning", riskLabel: "medium" },
          { id: "approval_faction_old", draftId: "draft_faction_31", type: "faction", title: "派系：旧宗门复辟派", summary: "与角色草案关联，一并等待确认", riskTone: "warning", riskLabel: "medium" }
        ],
        runSnapshot: { tool: "write_full_pipeline", status: "audit failed", next: "章节深读 + 定点修订" },
        chapterWorkbench: {
          title: "第 13 章 · 深读与审计诊断",
          reading: [
            "夜色压在断崖上，风里尽是未散的血气。裴烬站在残碑前，像在等人，又像在等一个拖了太久的答案。",
            "林烬尘提剑而来时，并没有立刻出手。他先看见了断碑后的旧宗门印记，也看见了那些被刻意擦去的名号。",
            "“你终于还是来了。”裴烬说得很轻，仿佛他们此刻不是生死相见，而是多年旧友的一场迟到夜谈。",
            "崖下风声愈急，远处封印阵纹却在此时提前亮起。这意味着冲突被推得太快，角色的真实意图还没充分显影。"
          ],
          auditIssues: [
            { tone: "warning", title: "节奏推进过快", body: "冲突与机制触发几乎同时发生，高潮层次被压扁。" },
            { tone: "warning", title: "角色动机显影不足", body: "裴烬对主角的利用目的出现得太突然，缺少一层铺垫。" },
            { tone: "primary", title: "truth 一致性仍然可救", body: "主要是章节内部节奏问题，还未撞断既有设定。" }
          ],
          revisionSteps: [
            { tone: "primary", title: "补一段裴烬识别主角价值的心理预热", body: "让“借主角开门”的计划在对话前先被隐约暗示。" },
            { tone: "primary", title: "阵纹触发延后半拍", body: "让封印机制跟在情绪确认之后，而不是抢跑。" },
            { tone: "primary", title: "保留夜谈感，不要直接爆成纯打斗", body: "这章更适合“锋芒未尽显”的紧绷。" }
          ],
          noteQuote: "这一章的问题不是信息不够，而是角色心理和封印机制启动的先后关系没拉开。",
          recommendation: "先补动机，再推阵纹触发",
          impact: "第 14 章开场节奏",
          truthRefs: [
            { label: "current_state", value: "封印阵纹仍处于半激活描述" },
            { label: "character_matrix", value: "裴烬与主角关系未正式公开" },
            { label: "hooks", value: "第二卷需要埋入宗门旧史线" }
          ]
        },
        truthCenter: {
          files: [
            truthFile(
              "current_state.md",
              "current_state.md",
              "live",
              [
                "主角已进入旧宗门断崖区域，确认接触到残碑与封印阵纹。",
                "裴烬尚未正式公开真实目标，但已经出现“借主角开门”的暗示性台词。",
                "第二卷主冲突正在从正面对抗，逐步转向“利用与反利用”的双向博弈。",
                "封印阵纹仍处于半激活状态，当前阶段不能直接写成完全开启。"
              ],
              [
                { title: "第 12 章", body: "新增断崖区域与残碑信息。", tone: "primary" },
                { title: "第 13 章草案", body: "尝试提前写封印阵纹启动，当前未通过审计。", tone: "warning" }
              ],
              [
                { entity: "裴烬", relation: "主角 / 潜在利用对象", status: "暗线未公开" },
                { entity: "旧宗门封印", relation: "主线机制", status: "半激活" },
                { entity: "断崖残碑", relation: "历史信息入口", status: "已进入现场" }
              ],
              "“封印阵纹完全启动”的措辞会早于当前 truth 节奏。"
            ),
            truthFile(
              "hooks.md",
              "hooks.md",
              "14 hooks",
              [
                "第二卷需要埋下宗门旧史线，为第三卷幕后线留出回收空间。",
                "裴烬与主角的关系应该先呈现“互相利用”，再升级为正面对抗。"
              ],
              [{ title: "第 12 章", body: "补足断崖与残碑的触发条件。", tone: "primary" }],
              [{ entity: "旧宗门线", relation: "主线 hook", status: "持续铺垫" }],
              "hook 本身稳定，但第 13 章推进太快。"
            ),
            truthFile(
              "character_matrix.md",
              "character_matrix.md",
              "24 rels",
              [
                "林烬尘与裴烬目前仍是“互相试探”的关系，不能直接写成彻底撕破脸。",
                "宗门旧部之间尚未完成站队，复辟派仍需要更多中层连接点。"
              ],
              [{ title: "第 12 章", body: "补充裴烬与断崖残碑的接触史。", tone: "primary" }],
              [{ entity: "林烬尘 ↔ 裴烬", relation: "互相利用 / 待升级", status: "未公开" }],
              "裴烬的态度在草案里过于外显。"
            ),
            truthFile(
              "summaries.md",
              "summaries.md",
              "12 ch",
              [
                "第 12 章以残碑和断崖为重心，完成了第二卷旧史线的第一次显影。",
                "第 11 章末尾保留了对宗门旧部的模糊提及，可作为反派势力扩展入口。"
              ],
              [{ title: "第 12 章", body: "章节摘要已锁定到快照 12.4。", tone: "success" }],
              [{ entity: "卷二节奏", relation: "缓慢抬高", status: "稳定" }],
              "summaries 与 current_state 基本一致。"
            )
          ],
          recentReferences: [
            { title: "第 13 章审计诊断", body: "指出封印阵纹启动过快的问题。", when: "今天" },
            { title: "Chief / 反派候选生成", body: "读取了 character_matrix 与 summaries 摘要。", when: "今天" }
          ]
        },
        materialsCenter: {
          sourceThreadId: "thread_book_001_materials",
          sourceRunId: "run_chief_104",
          skillVersion: "character@1.3.0",
          formDefaults: {
            character: { positioning: "第二卷主反派候选", quantity: 3, constraints: "必须长期对抗主角，且不能撞现有势力设定。" },
            faction: { positioning: "第二卷主冲突势力", quantity: 3, constraints: "必须能承接旧宗门线，且不能覆盖现有中立势力。" },
            location: { positioning: "第二卷关键对峙地点", quantity: 3, constraints: "必须与断崖、残碑、旧史线自然衔接。" }
          },
          selectedCandidateIds: { character: "draft_character_18", faction: "draft_faction_31", location: "draft_location_41" },
          generationIndex: { character: 0, faction: 0, location: 0 },
          generatedSets: {
            character: [
              [
                candidate("draft_character_18", "裴烬", "主反派候选，借主角破开旧封印。", "旧宗门复辟派", "利用主角破开旧宗门封印，再反手抢回控制权。", "第二卷主反派，可延伸至第三卷幕后线。", "warning"),
                candidate("draft_character_19", "沈归野", "暗线操盘者，重建地下情报网。", "灰色情报盟", "不断切断主角的资源链。", "适合作为中长期骚扰型对手。", "active"),
                candidate("draft_character_20", "阎无赦", "失控强敌，以破界为终局。", "散修灾厄派", "更偏硬碰硬的灾难型冲突。", "短中期压制感强，但持续性稍弱。", "danger")
              ],
              [
                candidate("draft_character_21", "顾晦川", "旧宗门遗脉代理人，擅长借势逼宫。", "旧宗门复位派", "用旧史与血脉合法性抢夺主角卷二成果。", "第二卷至第三卷都可持续施压。", "warning"),
                candidate("draft_character_22", "宁照夜", "外冷内狠的资源操盘者。", "黑市盟会", "通过黑市网络封锁主角成长路径。", "可长期缠斗，但与宗门线衔接较弱。", "active"),
                candidate("draft_character_23", "祁断岳", "暴烈型旧部将领，擅长强压。", "旧宗门余部", "以军事和杀伐压制推进冲突。", "爆发强，但第三卷延展性一般。", "danger")
              ]
            ],
            faction: [
              [
                candidate("draft_faction_31", "旧宗门复辟派", "以合法性与旧史号召旧部回流。", "宗门旧部", "会把主角当成破局钥匙。", "可作为第二卷底盘势力。", "warning"),
                candidate("draft_faction_32", "暗河情报盟", "地下情报与资源转运网络。", "黑市组织", "专打侧翼，不与明面势力硬碰。", "中长期都可使用。", "active"),
                candidate("draft_faction_33", "破界遗民会", "崇拜破界力量的极端组织。", "异端教团", "更适合抬高灾难感。", "更适合第三卷前置。", "danger")
              ]
            ],
            location: [
              [
                candidate("draft_location_41", "万坠断崖", "断崖与残碑构成的旧宗门遗址前厅。", "遗迹地点", "适合作为卷二反派与主角的第一次真正试探场。", "可复用为卷二关键地点。", "active"),
                candidate("draft_location_42", "无灯石窟", "地下情报交换点，利于埋暗线。", "黑市地点", "便于引出暗河情报盟。", "可作为中继节点。", "warning"),
                candidate("draft_location_43", "断律旧殿", "旧宗门法统残殿，偏制度冲突。", "遗址地点", "有利于法统派或律堂派系进场。", "可为卷三做伏笔。", "active")
              ]
            ]
          },
          library: [
            libraryItem("draft_character_18", "裴烬", "character", "draft", "run_chief_104", "刚刚", "第二卷主反派候选，借主角破开旧封印。"),
            libraryItem("draft_faction_31", "旧宗门复辟派", "faction", "draft", "run_chief_103", "08:14", "第二卷反派阵营候选，与裴烬关联。"),
            libraryItem("mat_loc_applied_2", "断律旧殿", "location", "applied", "run_chief_067", "昨天", "旧宗门法统残殿，可作为后续法统冲突入口。")
          ],
          quickCompareCopy: [
            "裴烬比另外两位更适合当前第二卷，因为他和既有宗门线的衔接最自然，写入后可以立刻参与第 14 章铺垫。",
            "如果你更想做三卷黑幕，顾晦川会是更强的三卷延展选项，但卷二首层冲突感不如裴烬。",
            "阎无赦的爆发强，但会把第二卷推得过硬，容易抢掉旧史与心理博弈的戏。"
          ]
        }
      },
      {
        id: "book_002",
        title: "焚星录",
        phase: "materials",
        phaseLabel: "materials building",
        active: true,
        archived: false,
        riskTone: "active",
        riskLabel: "低风险",
        latestAction: "角色派系待应用保存",
        lastActivity: "角色候选待保存",
        lastEditedAt: "08:18",
        chapterCurrent: 8,
        chapterTarget: 36,
        wordCount: 188900,
        truthFilesCount: 6,
        materialsCount: 17,
        pendingDrafts: 1,
        nextAction: { title: "先确认卷一末段角色与派系，再继续写第 9 章", body: "当前没有阻断错误，但 materials 未锁定会导致后续章节重复返工。" },
        chapterActivity: [{ chapter: 8, statusTone: "active", statusLabel: "waiting materials", note: "角色与派系待落盘" }],
        healthAlerts: [{ tone: "active", title: "角色草案待保存", body: "保存后可直接进入第 9 章写作。" }],
        decisions: [{ title: "冻结火种试炼主线", body: "卷一末段的考核机制不再修改。", when: "昨天" }],
        approvals: [{ id: "approval_book2_char", draftId: "draft_fenxing_char_1", type: "character", title: "角色：黎槿", summary: "卷一末段新对手，待写入 materials/characters", riskTone: "active", riskLabel: "low" }],
        runSnapshot: { tool: "material.generate", status: "awaiting save", next: "选择角色草案并刷新 materials_summary" },
        materialsCenter: {
          sourceThreadId: "thread_book_002_materials",
          sourceRunId: "run_book2_018",
          skillVersion: "character@1.3.0",
          formDefaults: {
            character: { positioning: "卷一末段竞争对手", quantity: 3, constraints: "不能和现有宗门势力冲突，必须能推动试炼终局。" },
            faction: { positioning: "试炼监督派系", quantity: 2, constraints: "必须与试炼规则挂钩。" },
            location: { positioning: "终局试炼地点", quantity: 2, constraints: "必须能承接火种与资源争夺。" }
          },
          selectedCandidateIds: { character: "draft_fenxing_char_1", faction: "draft_fenxing_faction_1", location: "draft_fenxing_loc_1" },
          generationIndex: { character: 0, faction: 0, location: 0 },
          generatedSets: {
            character: [[
              candidate("draft_fenxing_char_1", "黎槿", "卷一末段竞争对手，擅长抢资源位。", "试炼旁支", "在规则边缘逼迫主角让步。", "卷一尾段够用，也能留到卷二。", "active"),
              candidate("draft_fenxing_char_2", "叶崇", "强硬型对手，靠实力压场。", "试炼正统", "偏硬碰硬，层次略单。", "中短期可用。", "warning"),
              candidate("draft_fenxing_char_3", "商归鹤", "交易型操盘者。", "资源商会", "通过交易切断主角选择。", "长期可用，但卷一侵入感稍弱。", "active")
            ]],
            faction: [[candidate("draft_fenxing_faction_1", "火种监管局", "维护试炼规则的保守派。", "监管派", "与主角存在制度冲突。", "卷二也能继续。", "warning")]],
            location: [[candidate("draft_fenxing_loc_1", "熔炉试台", "火种试炼最终场。", "试炼地点", "便于做资源争夺。", "卷一关键地点。", "active")]]
          },
          library: [libraryItem("draft_fenxing_char_1", "黎槿", "character", "draft", "run_book2_018", "刚刚", "卷一末段竞争对手候选。")],
          quickCompareCopy: ["黎槿最适合当前卷尾，因为她能直接把资源争夺和主角成长压力绑定。"]
        }
      },
      {
        id: "book_003",
        title: "折月长歌",
        phase: "truth cleanup",
        phaseLabel: "truth cleanup",
        active: true,
        archived: false,
        riskTone: "danger",
        riskLabel: "高风险",
        latestAction: "truth files 刚同步",
        lastActivity: "truth files 变更 52 分钟前",
        lastEditedAt: "07:50",
        chapterCurrent: 22,
        chapterTarget: 48,
        wordCount: 501320,
        truthFilesCount: 9,
        materialsCount: 30,
        pendingDrafts: 0,
        nextAction: { title: "先处理地点与 summaries 的漂移", body: "当前高风险来自 truth 冲突，不建议继续写新章。" },
        chapterActivity: [{ chapter: 22, statusTone: "danger", statusLabel: "truth drift", note: "地点状态与 summaries 不一致" }],
        healthAlerts: [{ tone: "danger", title: "地点设定发生漂移", body: "必须先修复 truth 再继续写作。" }],
        decisions: [{ title: "暂停写第 23 章", body: "先做 truth cleanup。", when: "今天" }],
        approvals: [],
        runSnapshot: { tool: "truth.sync", status: "needs review", next: "核对地点设定并回写 summaries" },
        truthCenter: {
          files: [
            truthFile("current_state.md", "current_state.md", "live", ["月海古桥目前应处于封闭状态，但第 22 章摘要写成了已开放。"], [{ title: "第 22 章", body: "错误写成地点已开放。", tone: "warning" }], [{ entity: "月海古桥", relation: "关键地点", status: "封闭" }], "地点开放状态与 summaries 冲突。"),
            truthFile("summaries.md", "summaries.md", "22 ch", ["第 22 章摘要错误记录了“月海古桥开放”。"], [{ title: "第 22 章", body: "摘要待修正。", tone: "warning" }], [{ entity: "月海古桥", relation: "章节摘要", status: "写错" }], "summary 源头需要修正。")
          ],
          recentReferences: [{ title: "truth.sync", body: "检测到地点状态冲突。", when: "今天" }]
        }
      },
      {
        id: "book_004",
        title: "太初纪元",
        phase: "daemon queued",
        phaseLabel: "daemon queued",
        active: true,
        archived: false,
        riskTone: "active",
        riskLabel: "低风险",
        latestAction: "等待凌晨自动写作",
        lastActivity: "等待凌晨自动写作",
        lastEditedAt: "昨天",
        chapterCurrent: 31,
        chapterTarget: 60,
        wordCount: 742110,
        truthFilesCount: 8,
        materialsCount: 21,
        pendingDrafts: 0,
        nextAction: { title: "无需人工干预，等待下一次 daemon 轮转", body: "当前状态稳定，适合作为后台自动推进项目。" },
        chapterActivity: [{ chapter: 31, statusTone: "active", statusLabel: "queued", note: "等待自动写作" }],
        healthAlerts: [],
        decisions: [],
        approvals: [],
        runSnapshot: { tool: "scheduler", status: "queued", next: "凌晨自动写作" }
      }
    ],
    archivedBooks: [
      { id: "book_005", title: "青冥剑歌", phaseLabel: "archived", chapterCurrent: 40, chapterTarget: 40, wordCount: 620400 },
      { id: "book_006", title: "万象天穹", phaseLabel: "archived", chapterCurrent: 52, chapterTarget: 52, wordCount: 880020 },
      { id: "book_007", title: "北海归墟", phaseLabel: "archived", chapterCurrent: 38, chapterTarget: 38, wordCount: 541120 },
      { id: "book_008", title: "长烬书", phaseLabel: "archived", chapterCurrent: 44, chapterTarget: 44, wordCount: 712440 },
      { id: "book_009", title: "镜川夜行", phaseLabel: "archived", chapterCurrent: 36, chapterTarget: 36, wordCount: 468220 }
    ],
    dashboard: {
      todayWords: 6820,
      runsToday: 14,
      activeSteps: 6,
      retries: 2,
      passRate: "97%",
      operatorNotes: [
        { title: "中午前优先修《吞天魔帝》第 13 章", body: "章节页已有 audit-report，可直接进入上下文阅读。", route: "../../chapter-workbench/v2/index.html", bookId: "book_001", cta: "打开" },
        { title: "为《焚星录》确定角色派系", body: "当前有 3 个候选草案，默认未写入 materials。", route: "../../materials-center/v2/index.html", bookId: "book_002", cta: "查看" }
      ],
      recentRuns: [
        { tone: "success", title: "write_full_pipeline / 吞天魔帝 第 13 章", body: "Writer 完成，Auditor 失败，已生成结构化问题摘要。", when: "08:42" },
        { tone: "warning", title: "material.generate / 焚星录 角色派系", body: "3 个候选已返回，等待用户应用保存。", when: "08:18" },
        { tone: "primary", title: "truth.sync / 折月长歌", body: "current_state 与 summaries 已进入核对流程。", when: "07:50" }
      ],
      quickResponses: [
        "建议优先顺序：吞天魔帝 → 焚星录 → 折月长歌。第一本直接影响当前写作链路，第二本会影响后续 materials 注入。",
        "如果今天只有半天，先修《吞天魔帝》第 13 章，再锁定《焚星录》的角色草案。",
        "《折月长歌》是高风险，但它更像校对清理，不如前两本的即时收益高。"
      ]
    },
    chief: {
      threads: [
        { id: "thread_book_001_materials", title: "生成第二卷反派候选", scope: "book", bookId: "book_001", statusTone: "warning", statusLabel: "待确认", updatedAt: "刚刚" },
        { id: "thread_book_001_ch13", title: "继续写《吞天魔帝》第 13 章", scope: "chapter", bookId: "book_001", statusTone: "active", statusLabel: "运行中", updatedAt: "5 分钟前" },
        { id: "thread_book_001_audit", title: "诊断第 12 章审计失败", scope: "chapter", bookId: "book_001", statusTone: "success", statusLabel: "已完成", updatedAt: "昨天" },
        { id: "thread_global_ops", title: "项目巡检", scope: "global", bookId: null, statusTone: "active", statusLabel: "global", updatedAt: "今天" },
        { id: "thread_materials_cleanup", title: "素材整理", scope: "materials", bookId: "book_002", statusTone: "active", statusLabel: "materials", updatedAt: "今天" }
      ],
      replies: [
        "如果你选裴烬，这条线完全可以拉长到第三卷，因为他的目标天然能从“借你开门”升级成“借你夺权”。",
        "要把裴烬拉长到第三卷，关键不是再给他更强的武力，而是给他更稳的法统与旧史合法性。",
        "如果你更想做三卷黑幕，顾晦川也可以，但卷二首层冲突感不如裴烬直接。"
      ]
    },
    automation: {
      daemon: { running: true, uptime: "06:14:22", workers: "2 / 4", failuresToday: 2, nextInspection: "09:40", writeCron: "0 */2 * * *", radarCron: "15 */6 * * *", dailyCap: "6 chapters" },
      queue: [
        { id: "job_912", target: "吞天魔帝 / ch13", task: "audit_recheck", status: "queued", tone: "warning" },
        { id: "job_913", target: "焚星录 / materials", task: "summary_refresh", status: "running", tone: "active" }
      ],
      history: [
        { id: "job_901", target: "折月长歌 / truth", task: "truth_sync", status: "completed", tone: "success" },
        { id: "job_902", target: "太初纪元 / ch31", task: "write_cycle", status: "cancelled", tone: "danger" }
      ],
      logs: [
        "[08:42] audit_recheck queued for book_001/ch13",
        "[08:18] materials_summary refresh started for book_002",
        "[07:50] truth sync completed for book_003",
        "[07:12] daemon heartbeat ok"
      ],
      failureClusters: [
        { tone: "warning", title: "吞天魔帝 / audit failed", body: "角色动机与节奏问题导致审计阻断。" },
        { tone: "warning", title: "折月长歌 / truth drift", body: "地点状态与 summaries 不一致。" }
      ],
      quickResponses: [
        "今天失败最多的仍然是审计阻断，其次是 truth drift。二者都集中在节奏和状态源不一致。",
        "如果你只改一个调度面动作，建议先暂停会继续触发 truth drift 的书，再把吞天魔帝的 recheck 放到优先队列。"
      ]
    },
    settings: {
      savedAt: "今天 09:12",
      sections: [
        { id: "general", label: "基础" },
        { id: "model-routing", label: "模型路由" },
        { id: "notifications", label: "通知提醒" },
        { id: "project-defaults", label: "项目默认" },
        { id: "advanced", label: "高级能力" }
      ],
      defaults: {
        projectRoot: "D:\\workspaces\\cli\\inkos\\test-project",
        dailyMaxChapters: "6",
        writingPace: "优先保证连贯与节奏，不以单章爆点牺牲长期冲突线。",
        desktopNotifications: "开启",
        highRiskAlerts: "立即提醒",
        chiefModel: "gemini-3.1-pro-high",
        writerModel: "gpt-5.4",
        auditorModel: "gpt-5.4",
        defaultBookGenre: "玄幻长篇",
        defaultWordGoal: "850000",
        skillTrackCharacter: "stable",
        skillTrackFaction: "stable",
        skillTrackLocation: "experimental",
        approvalMode: "破坏性动作必须确认"
      },
      quickResponses: [
        "如果你优先想提高稳定性，先保持 Chief 和 Auditor 的模型路由不要频繁切换，再把高风险提醒保留为“立即提醒”。",
        "当前最不建议动的是默认写作节奏，它会影响后续所有章节的语气与推进速度。"
      ]
    }
  };
})();
