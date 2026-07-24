/* ============================================================================
   KAZEI — TRAVEL PERSONALITY QUIZ
   ----------------------------------------------------------------------------
   Kiến trúc file (clean architecture, không phụ thuộc framework):

   1. DATA LAYER      — Toàn bộ nội dung câu hỏi, đáp án, điểm số, mô tả kết quả
                         được khai báo dưới dạng object/array thuần JS.
                         => Muốn thêm/sửa/xoá câu hỏi chỉ cần chỉnh phần này,
                            KHÔNG cần đụng vào phần render hay HTML.

   2. STATE LAYER     — Một object "state" duy nhất lưu toàn bộ trạng thái quiz
                         (câu hỏi hiện tại, câu trả lời, điểm số...).

   3. LOGIC LAYER     — Các hàm tính điểm, phân loại personality, build profile.

   4. RENDER LAYER    — Các hàm chịu trách nhiệm vẽ giao diện dựa trên state.
                         Không hardcode nội dung câu hỏi trong HTML/JS render.

   5. EVENT LAYER     — Gắn sự kiện cho các nút bấm, input.

   6. INIT            — Khởi chạy ứng dụng.
============================================================================ */

(function () {
  'use strict';

  /* ==========================================================================
     CONFIG LUCAS THÊM
  ========================================================================== */

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxl_vVOmskSazkaF7PEuK27KeeGbF5GNlpBct50WRUMverCWYLcuFyob_39wW3GtXPWQw/exec";

  /* ==========================================================================
     1. DATA LAYER
  ========================================================================== */

  /**
   * PHẦN 1 — Bộ câu hỏi phân loại phong cách du lịch.
   * Mỗi câu có 3 đáp án (A/B/C), mỗi đáp án cộng điểm cho 1-2 nhóm tính cách:
   * explorer | reflector | creator
   */
  const QUESTIONS_PERSONALITY = [
    {
      id: 'q1',
      question: 'Khi vừa đến một thành phố mới, bạn thường...',
      options: [
        { text: 'Đi bộ khám phá ngay khu vực xung quanh.', scores: { explorer: 2, creator: 1 } },
        { text: 'Tìm một quán cà phê đẹp rồi ngồi quan sát.', scores: { reflector: 2, creator: 1 } },
        { text: 'Mở Google Maps và lên kế hoạch cho cả ngày.', scores: { creator: 2, explorer: 1 } }
      ]
    },
    {
      id: 'q2',
      question: 'Nếu ngày mai phải dậy lúc 5h để ngắm bình minh tuyệt đẹp, bạn sẽ...',
      options: [
        { text: 'Chắc chắn đi.', scores: { explorer: 2, reflector: 1 } },
        { text: 'Tùy hôm đó có thấy thoải mái không.', scores: { reflector: 2, creator: 1 } },
        { text: 'Nếu lịch trình hợp lý thì đi.', scores: { creator: 2, explorer: 1 } }
      ]
    },
    {
      id: 'q3',
      question: 'Bạn thích chuyến đi có nhịp độ...',
      options: [
        { text: 'Đi được nhiều nơi.', scores: { explorer: 2, creator: 1 } },
        { text: 'Chậm rãi.', scores: { reflector: 2, explorer: 1 } },
        { text: 'Linh hoạt, thích thì đổi.', scores: { creator: 2, reflector: 1 } }
      ]
    },
    {
      id: 'q4',
      question: 'Nếu có thêm 3 tiếng tự do, bạn sẽ...',
      options: [
        { text: 'Ghé thêm một địa điểm.', scores: { explorer: 2, creator: 1 } },
        { text: 'Ở lại nơi mình đang thích.', scores: { reflector: 2, creator: 1 } },
        { text: 'Tìm một trải nghiệm mới chưa có trong lịch trình.', scores: { creator: 2, explorer: 1 } }
      ]
    },
    {
      id: 'q5',
      question: 'Bạn hứng thú nhất với...',
      options: [
        { text: 'Điều chưa từng thử.', scores: { explorer: 2, creator: 1 } },
        { text: 'Điều khiến mình thấy bình yên.', scores: { reflector: 2, explorer: 1 } },
        { text: 'Điều mình có thể tự tạo dấu ấn riêng.', scores: { creator: 2, reflector: 1 } }
      ]
    },
    {
      id: 'q6',
      question: 'Điều khiến bạn tiếc nhất sau một chuyến đi là...',
      options: [
        { text: 'Chưa khám phá đủ.', scores: { explorer: 2, creator: 1 } },
        { text: 'Không được nghỉ ngơi đủ.', scores: { reflector: 2, explorer: 1 } },
        { text: 'Chuyến đi quá giống mọi người.', scores: { creator: 2, explorer: 1 } }
      ]
    },
    {
      id: 'q7',
      question: 'Bạn thích lịch trình được thiết kế như thế nào?',
      options: [
        { text: 'Có sẵn đầy đủ mọi thứ để tối ưu thời gian.', scores: { explorer: 2, reflector: 1 } },
        { text: 'Có nhịp độ vừa phải, không quá dày đặc các điểm đến và hoạt động.', scores: { reflector: 2, creator: 1 } },
        { text: 'Chỉ cần vài điểm chính, còn lại mình thích tùy hứng.', scores: { creator: 2, explorer: 1 } }
      ]
    },
    {
      id: 'q8',
      question: 'Một chuyến đi thành công là khi...',
      options: [
        { text: 'Trải nghiệm được nhiều hoạt động, đi được nhiều nơi, biết thêm nhiều điều.', scores: { explorer: 2, creator: 1 } },
        { text: 'Cảm thấy "được chữa lành".', scores: { reflector: 2, creator: 1 } },
        { text: 'Có cảm giác "đây đúng là chuyến đi của riêng mình".', scores: { creator: 2, reflector: 1 } }
      ]
    }
  ];

  /**
   * PHẦN 2 — Bộ câu hỏi thu thập thông tin cho Travel Planner.
   * type: 'single'   -> chọn 1 đáp án (radio)
   *       'multiple' -> chọn nhiều đáp án (checkbox)
   * maxSelect: giới hạn số lựa chọn tối đa (chỉ áp dụng cho 'multiple')
   * field: tên field tương ứng trong object travelerProfile
   * exclusiveOptions: mảng index của các đáp án mang tính loại trừ
   *                   (chọn đáp án này sẽ tự bỏ chọn các đáp án khác)
   */
  const QUESTIONS_PROFILE = [
    {
      id: 'p1',
      field: 'travelGroup',
      type: 'single',
      question: 'Lần này bạn sẽ đi cùng ai?',
      options: [
        { text: 'Một mình' },
        { text: 'Người yêu / Vợ chồng' },
        { text: 'Gia đình' },
        { text: 'Bạn bè' },
        { text: 'Đồng nghiệp' },
        { text: 'Khác' }
      ]
    },
    {
      id: 'p2',
      field: 'groupSize',
      type: 'single',
      question: 'Nhóm của bạn có khoảng bao nhiêu người?',
      options: [
        { text: '1 (mình đi một mình)' },
        { text: '2' },
        { text: '3–4' },
        { text: '5–7' },
        { text: '8+' }
      ]
    },
    {
      id: 'p3',
      field: 'constraints',
      type: 'multiple',
      question: 'Bạn/ nhóm có ai thuộc các trường hợp dưới đây không?',
      helper: 'Chọn tất cả những gì phù hợp.',
      options: [
        { text: 'Có trẻ nhỏ' },
        { text: 'Có người lớn tuổi' },
        { text: 'Có người dễ say xe/ tàu/ máy bay' },
        { text: 'Có người thể lực không tốt' },
        { text: 'Có người ăn chay hoặc chế độ ăn đặc biệt' },
        { text: 'Không có trường hợp nào', exclusive: true }
      ]
    },
    {
      id: 'p4',
      field: 'tripReason',
      type: 'multiple',
      maxSelect: 3,
      question: 'Điều gì khiến bạn/ nhóm quyết định thực hiện chuyến đi này?',
      helper: 'Chọn tối đa 3.',
      options: [
        { text: 'Nghỉ ngơi' },
        { text: 'Kỷ niệm dịp đặc biệt' },
        { text: 'Khám phá vùng đất mới' },
        { text: 'Gắn kết với nhau' },
        { text: 'Đổi gió' },
        { text: 'Ấp ủ từ lâu' },
        { text: 'Có sự kiện hoặc mùa đẹp' },
        { text: 'Khác' }
      ]
    },
    {
      id: 'p5',
      field: 'primaryGoal',
      type: 'single',
      question: 'Nếu chỉ có một điều thành công nhất ở chuyến đi này, đó sẽ là...',
      options: [
        { text: 'Nhiều trải nghiệm mới' },
        { text: 'Thật sự được nghỉ ngơi' },
        { text: 'Cảm thấy kết nối và hiểu người đi cùng mình hơn' },
        { text: 'Có nhiều kỷ niệm' },
        { text: 'Có nhiều ảnh đẹp' },
        { text: 'Có cảm hứng mới' },
        { text: 'Ăn thật ngon' }
      ]
    },
    {
      id: 'p6',
      field: 'travelPace',
      type: 'single',
      question: 'Bạn/ nhóm thích nhịp độ thế nào?',
      options: [
        { text: 'Đi thật nhiều' },
        { text: 'Cân bằng' },
        { text: 'Chậm rãi' }
      ]
    },
    {
      id: 'p7',
      field: 'groupPreferences',
      type: 'multiple',
      question: 'Bạn/ nhóm có những kiểu người nào?',
      helper: 'Chọn tất cả những gì phù hợp.',
      options: [
        { text: 'Người mê khám phá' },
        { text: 'Người thích chill' },
        { text: 'Người mê chụp ảnh' },
        { text: 'Người thích ăn uống' },
        { text: 'Người thích mua sắm' },
        { text: 'Người thích văn hóa' },
        { text: 'Người thích thiên nhiên' },
        { text: 'Người thích hoạt động' },
        { text: 'Người thích lịch trình rõ ràng' },
        { text: 'Người thích ngẫu hứng' }
      ]
    },
    {
      id: 'p8',
      field: 'travelHistory',
      type: 'multiple',
      question: 'Bạn đã từng đi những loại điểm đến nào?',
      helper: 'Chọn tất cả những gì phù hợp.',
      options: [
        { text: 'Thành phố' },
        { text: 'Biển' },
        { text: 'Núi' },
        { text: 'Đảo' },
        { text: 'Roadtrip' },
        { text: 'Làng cổ' },
        { text: 'Tuyết' },
        { text: 'Sa mạc' },
        { text: 'Chưa đi nhiều', exclusive: true }
      ]
    },
    {
      id: 'p9',
      field: 'bestMemories',
      type: 'multiple',
      maxSelect: 3,
      question: 'Điều khiến bạn nhớ nhất trong các chuyến đi trước?',
      helper: 'Chọn tối đa 3.',
      options: [
        { text: 'Cảnh đẹp' },
        { text: 'Con người' },
        { text: 'Văn hóa' },
        { text: 'Ẩm thực' },
        { text: 'Những cuộc trò chuyện' },
        { text: 'Cảm giác bình yên' },
        { text: 'Những trải nghiệm bất ngờ' },
        { text: 'Những bức ảnh' },
        { text: 'Khoảnh khắc với người đồng hành' }
      ]
    },
    {
      id: 'p10',
      field: 'avoidList',
      type: 'multiple',
      maxSelect: 3,
      question: 'Bạn muốn tránh điều gì nhất?',
      helper: 'Chọn tối đa 3.',
      options: [
        { text: 'Dậy quá sớm' },
        { text: 'Di chuyển quá nhiều' },
        { text: 'Đông người' },
        { text: 'Lịch trình quá dày' },
        { text: 'Đi bộ quá nhiều' },
        { text: 'Hoạt động ngoài trời quá nhiều' },
        { text: 'Ăn uống khó hợp khẩu vị' },
        { text: 'Không có điều gì cần tránh', exclusive: true }
      ]
    }
  ];

  /**
   * Metadata mô tả 3 nhóm tính cách du lịch.
   * icon: chuỗi SVG (line-art, dùng currentColor để ăn theo accent color).
   * essence: cụm từ ngắn dùng để ghép câu mô tả cho kết quả "blend".
   * description: đoạn mô tả đầy đủ (~120-150 từ) dùng khi kết quả là 1 nhóm rõ rệt.
   */
  const PERSONALITY_TYPES = {
    explorer: {
      key: 'explorer',
      nameVI: 'Nhà Thám Hiểm',
      nameEN: 'The Explorer',
      essence: 'luôn muốn bước ra khỏi vùng quen thuộc để khám phá điều mới',
      icon:
        '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="1.6"/><path d="M30.5 17.5L21 21L17.5 30.5L27 27L30.5 17.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="24" cy="24" r="1.8" fill="currentColor"/></svg>',
      description:
        'Bạn là người luôn muốn bước ra khỏi vùng an toàn để khám phá những điều mới mẻ. Với bạn, một chuyến đi đúng nghĩa là khi được đi bộ qua những con phố lạ, thử món ăn chưa từng nếm, và bắt chuyện với những người bạn chưa từng gặp. Bạn không ngại dậy sớm để đón bình minh, không ngại đi xa hơn một chút nếu điều đó đồng nghĩa với một trải nghiệm đáng nhớ. Bạn thích lịch trình đủ dày để không bỏ lỡ điều gì, nhưng vẫn giữ được sự tò mò để đón nhận những bất ngờ dọc đường. Với bạn, thành công của một chuyến đi được đo bằng số điều mới học được và những câu chuyện sẽ kể lại sau này. Kazei sẽ thiết kế một hành trình đủ phong phú để nuôi dưỡng sự tò mò không ngừng nghỉ của bạn.'
    },
    reflector: {
      key: 'reflector',
      nameVI: 'Người Sống Chậm',
      nameEN: 'The Reflector',
      essence: 'tìm kiếm sự bình yên và muốn sống chậm lại',
      icon:
        '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31 15C26 15 22 19.5 22 25C22 30.5 26 35 31 35C25 37.5 17.5 35.5 14 29C10.3 22 13.3 13.7 20.5 10.2C18.7 12.7 18 15.7 19 19C20.3 23.3 25 15.8 31 15Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
      description:
        'Bạn là người tìm đến du lịch không phải để chạy đua với thời gian, mà để tìm lại nhịp thở của chính mình. Một buổi sáng ngồi yên bên tách cà phê, ngắm nhìn thành phố thức giấc, đã đủ để bạn thấy trọn vẹn. Bạn không cần đi thật nhiều nơi, chỉ cần mỗi khoảnh khắc đều được sống chậm và không vội vã. Với bạn, một chuyến đi thành công là khi tâm trí được nghỉ ngơi thật sự, khi những lo toan thường ngày tạm được gác lại, và khi bạn cảm nhận được sự kết nối sâu sắc hơn với người đồng hành. Bạn thích những lịch trình có khoảng trống, để có thể chậm lại bất cứ khi nào cần. Kazei sẽ thiết kế một hành trình đủ nhẹ nhàng, đủ tĩnh lặng, để bạn thật sự được chữa lành sau mỗi chuyến đi.'
    },
    creator: {
      key: 'creator',
      nameVI: 'Người Kiến Tạo',
      nameEN: 'The Creator',
      essence: 'thích tự do lựa chọn và tạo nên dấu ấn riêng',
      icon:
        '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 8L27 20L39 24L27 28L24 40L21 28L9 24L21 20L24 8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
      description:
        'Bạn là người thích tự viết nên câu chuyện du lịch của riêng mình, thay vì đi theo một khuôn mẫu có sẵn. Bạn thoải mái với sự thay đổi, thích những lịch trình đủ mở để có thể tùy hứng rẽ sang một hướng khác nếu cảm thấy phù hợp. Với bạn, một chuyến đi đáng nhớ không nằm ở việc đi được bao nhiêu nơi, mà ở cảm giác "đây đúng là chuyến đi của mình" — không giống bất kỳ ai khác. Bạn thích tự do lựa chọn, tự tạo dấu ấn riêng trong từng khoảnh khắc, và không ngại thử một cách trải nghiệm khác biệt. Kazei sẽ thiết kế một khung hành trình vừa đủ để bạn có điểm tựa, nhưng vẫn chừa đủ khoảng trống để bạn tự do sáng tạo nên phiên bản du lịch của riêng mình.'
    }
  };

  /** Metadata cho kết quả "Traveler Blend" (khi cả 3 nhóm gần bằng nhau). */
  const TRAVELER_BLEND = {
    nameVI: 'Nhà Du Hành Đa Sắc',
    nameEN: 'Traveler Blend',
    icon:
      '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="19" r="11" stroke="currentColor" stroke-width="1.4"/><circle cx="29" cy="19" r="11" stroke="currentColor" stroke-width="1.4"/><circle cx="24" cy="28" r="11" stroke="currentColor" stroke-width="1.4"/></svg>',
    description:
      'Bạn không thuộc hẳn về một phong cách du lịch nào — và đó chính là điều đặc biệt ở bạn. Bạn có thể vừa háo hức khám phá một con phố lạ, vừa muốn dành cả buổi chiều chỉ để ngồi yên tận hưởng, rồi bất chợt đổi ý để làm điều gì đó hoàn toàn ngẫu hứng. Sự linh hoạt này giúp bạn dễ dàng thích nghi với nhiều kiểu hành trình khác nhau, tùy vào tâm trạng và bối cảnh lúc đó. Kazei sẽ thiết kế một hành trình cân bằng, đủ đa dạng để nuôi dưỡng mọi khía cạnh trong con người du lịch của bạn.'
  };

  /* ==========================================================================
     2. STATE LAYER
  ========================================================================== */

  /** Gộp 2 phần câu hỏi thành một mảng "steps" duy nhất để điều hướng tuyến tính. */
  const STEPS = [
    ...QUESTIONS_PERSONALITY.map((q) => Object.assign({ part: 1, type: 'single' }, q)),
    ...QUESTIONS_PROFILE.map((q) => Object.assign({ part: 2 }, q))
  ];
  const TOTAL_STEPS = STEPS.length;

  const state = {
    userName: '',
    currentStep: 0, // index trong STEPS
    answers: {}, // { [questionId]: number | number[] }
    scores: { explorer: 0, reflector: 0, creator: 0 }
  };

  /* ==========================================================================
     3. LOGIC LAYER
  ========================================================================== */

  /** Ghi nhận đáp án cho câu hỏi trắc nghiệm 1 lựa chọn (Phần 1 & radio Phần 2). */
  function selectSingleAnswer(step, optionIndex) {
    state.answers[step.id] = optionIndex;
  }

  /** Toggle 1 lựa chọn cho câu hỏi checkbox, có xử lý logic loại trừ & giới hạn số lượng. */
  function toggleMultipleAnswer(step, optionIndex) {
    const option = step.options[optionIndex];
    let current = state.answers[step.id] || [];

    const alreadySelected = current.includes(optionIndex);

    if (alreadySelected) {
      current = current.filter((i) => i !== optionIndex);
    } else {
      if (option.exclusive) {
        // Chọn đáp án loại trừ -> xoá hết các lựa chọn khác.
        current = [optionIndex];
      } else {
        // Nếu đang có đáp án loại trừ được chọn -> bỏ nó khi chọn đáp án thường.
        current = current.filter((i) => !step.options[i].exclusive);
        if (step.maxSelect && current.length >= step.maxSelect) {
          return; // Đã đạt giới hạn, không cho chọn thêm.
        }
        current.push(optionIndex);
      }
    }
    state.answers[step.id] = current;
  }

  /** Tính lại điểm số 3 nhóm tính cách dựa trên toàn bộ đáp án Phần 1. */
  function recalculateScores() {
    const scores = { explorer: 0, reflector: 0, creator: 0 };
    QUESTIONS_PERSONALITY.forEach((q) => {
      const selectedIndex = state.answers[q.id];
      if (selectedIndex === undefined) return;
      const optionScores = q.options[selectedIndex].scores;
      Object.keys(optionScores).forEach((key) => {
        scores[key] += optionScores[key];
      });
    });
    state.scores = scores;
  }

  /** Kiểm tra một step đã được trả lời hợp lệ hay chưa (điều kiện để bấm "Tiếp tục"). */
  function isStepAnswered(step) {
    const answer = state.answers[step.id];
    if (step.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== null;
  }

  /**
   * Phân loại phong cách du lịch dựa trên % điểm 3 nhóm.
   * Trả về: { resultType, primaryKey, secondaryKey, percents }
   * resultType: 'single' | 'blend' | 'traveler-blend'
   */
  function classifyPersonality(scores) {
    const total = scores.explorer + scores.reflector + scores.creator || 1;
    const rawPercents = {
      explorer: (scores.explorer / total) * 100,
      reflector: (scores.reflector / total) * 100,
      creator: (scores.creator / total) * 100
    };

    // Làm tròn % nhưng vẫn đảm bảo tổng = 100 (điều chỉnh phần dư vào giá trị lớn nhất).
    const percents = roundPercentsTo100(rawPercents);

    const sorted = Object.keys(percents).sort((a, b) => percents[b] - percents[a]);
    const [firstKey, secondKey, thirdKey] = sorted;
    const firstVal = percents[firstKey];
    const secondVal = percents[secondKey];
    const thirdVal = percents[thirdKey];

    let resultType;
    let primaryKey = firstKey;
    let secondaryKey = null;

    if (firstVal - secondVal >= 10) {
      resultType = 'single';
    } else if (firstVal - thirdVal < 10) {
      resultType = 'traveler-blend';
    } else {
      resultType = 'blend';
      secondaryKey = secondKey;
    }

    return { resultType, primaryKey, secondaryKey, percents };
  }

  /** Làm tròn 3 số % sao cho tổng luôn bằng 100. */
  function roundPercentsTo100(rawPercents) {
    const keys = Object.keys(rawPercents);
    const floored = {};
    let flooredSum = 0;
    keys.forEach((k) => {
      floored[k] = Math.floor(rawPercents[k]);
      flooredSum += floored[k];
    });
    let remainder = 100 - flooredSum;
    // Phân bổ phần dư cho các nhóm có phần thập phân lớn nhất.
    const remainders = keys
      .map((k) => ({ key: k, frac: rawPercents[k] - floored[k] }))
      .sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remainder; i++) {
      floored[remainders[i % remainders.length].key] += 1;
    }
    return floored;
  }

  /** Build object travelerProfile hoàn chỉnh từ toàn bộ state hiện tại. */
  function buildTravelerProfile(classification) {
    const { resultType, primaryKey, secondaryKey, percents } = classification;

    let personalityLabel;
    if (resultType === 'single') {
      personalityLabel = PERSONALITY_TYPES[primaryKey].nameEN;
    } else if (resultType === 'blend') {
      personalityLabel =
        PERSONALITY_TYPES[primaryKey].nameEN + ' thiên ' + PERSONALITY_TYPES[secondaryKey].nameEN;
    } else {
      personalityLabel = TRAVELER_BLEND.nameEN;
    }

    // Chuyển đáp án Phần 2 từ index -> giá trị text thực tế theo từng field.
    const profileData = {};
    QUESTIONS_PROFILE.forEach((q) => {
      const answer = state.answers[q.id];
      if (q.type === 'multiple') {
        profileData[q.field] = (answer || []).map((idx) => q.options[idx].text);
      } else {
        profileData[q.field] = answer !== undefined ? q.options[answer].text : null;
      }
    });

    return {
      name: state.userName,
      personality: personalityLabel,
      explorerScore: state.scores.explorer,
      reflectorScore: state.scores.reflector,
      creatorScore: state.scores.creator,
      explorerPercent: percents.explorer,
      reflectorPercent: percents.reflector,
      creatorPercent: percents.creator,
      travelGroup: profileData.travelGroup,
      groupSize: profileData.groupSize,
      constraints: profileData.constraints,
      tripReason: profileData.tripReason,
      primaryGoal: profileData.primaryGoal,
      travelPace: profileData.travelPace,
      groupPreferences: profileData.groupPreferences,
      travelHistory: profileData.travelHistory,
      bestMemories: profileData.bestMemories,
      avoidList: profileData.avoidList,
      submittedAt: new Date().toISOString()
    };
  }

  /* ==========================================================================
     4. RENDER LAYER
  ========================================================================== */

  const dom = {
    screens: {
      intro: document.getElementById('screen-intro'),
      quiz: document.getElementById('screen-quiz'),
      result: document.getElementById('screen-result')
    },
    nameInput: document.getElementById('input-name'),
    btnStart: document.getElementById('btn-start'),
    progressFill: document.getElementById('quiz-progress-fill'),
    partLabel: document.getElementById('quiz-part-label'),
    countLabel: document.getElementById('quiz-count-label'),
    sectionTitle: document.getElementById('quiz-section-title'),
    sectionDesc: document.getElementById('quiz-section-desc'),
    questionContainer: document.getElementById('quiz-question-container'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
    resultCard: document.getElementById('result-card'),
    btnRetake: document.getElementById('btn-retake'),
    btnDownload: document.getElementById('btn-download')
  };

  /** Chuyển màn hình hiện tại với hiệu ứng fade/slide. */
  function showScreen(name) {
    Object.keys(dom.screens).forEach((key) => {
      dom.screens[key].classList.toggle('is-active', key === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Render toàn bộ giao diện của step hiện tại (thanh tiến trình + câu hỏi + đáp án). */
  function renderStep() {
    const step = STEPS[state.currentStep];

    // --- Thanh tiến trình ---
    const progressPercent = (state.currentStep / TOTAL_STEPS) * 100;
    requestAnimationFrame(() => {
      dom.progressFill.style.width = progressPercent + '%';
    });
    dom.partLabel.textContent = step.part === 1 ? 'Phần 1' : 'Phần 2';
    dom.countLabel.textContent = 'Câu ' + (state.currentStep + 1) + '/' + TOTAL_STEPS;

    // --- Tiêu đề & mô tả của từng phần ---
    if (step.part === 1) {
      dom.sectionTitle.textContent = 'Bạn là kiểu người du lịch nào?';
      dom.sectionDesc.textContent = 'Hãy chọn phương án gần với bạn nhất.';
    } else {
      dom.sectionTitle.textContent = 'Hiểu hơn về chuyến đi của bạn';
      dom.sectionDesc.textContent = 'Còn vài câu nữa thôi.';
    }

    // --- Câu hỏi + đáp án ---
    dom.questionContainer.innerHTML = '';
    dom.questionContainer.classList.remove('is-visible');

    const questionEl = document.createElement('h3');
    questionEl.className = 'question-text';
    questionEl.textContent = step.question;
    dom.questionContainer.appendChild(questionEl);

    if (step.helper) {
      const helperEl = document.createElement('p');
      helperEl.className = 'question-helper';
      helperEl.textContent = step.helper;
      dom.questionContainer.appendChild(helperEl);
    }

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';
    optionsList.setAttribute('role', step.type === 'multiple' ? 'group' : 'radiogroup');

    const currentAnswer = state.answers[step.id];
    const isMultiSelectFull =
      step.type === 'multiple' &&
      step.maxSelect &&
      Array.isArray(currentAnswer) &&
      currentAnswer.length >= step.maxSelect;

    step.options.forEach((option, index) => {
      const isSelected =
        step.type === 'multiple'
          ? Array.isArray(currentAnswer) && currentAnswer.includes(index)
          : currentAnswer === index;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'option-card' + (isSelected ? ' is-selected' : '');
      card.setAttribute(
        'aria-pressed',
        isSelected ? 'true' : 'false'
      );

      // Vô hiệu hoá thị giác các lựa chọn khác khi đã đạt giới hạn maxSelect.
      if (isMultiSelectFull && !isSelected) {
        card.classList.add('is-disabled');
      }

      const indicator = document.createElement('span');
      indicator.className =
        'option-indicator ' + (step.type === 'multiple' ? 'option-indicator--checkbox' : 'option-indicator--radio');

      const label = document.createElement('span');
      label.className = 'option-label';
      label.textContent = option.text;

      card.appendChild(indicator);
      card.appendChild(label);

      card.addEventListener('click', () => {
        if (step.type === 'multiple') {
          toggleMultipleAnswer(step, index);
        } else {
          selectSingleAnswer(step, index);
        }
        renderStep(); // re-render để cập nhật trạng thái chọn + nút Next
      });

      optionsList.appendChild(card);
    });

    dom.questionContainer.appendChild(optionsList);

    // Trigger animation vào khung hình.
    requestAnimationFrame(() => {
      dom.questionContainer.classList.add('is-visible');
    });

    // --- Nút điều hướng ---
    dom.btnPrev.disabled = state.currentStep === 0;
    dom.btnNext.disabled = !isStepAnswered(step);
    dom.btnNext.textContent = state.currentStep === TOTAL_STEPS - 1 ? 'Xem kết quả' : 'Tiếp tục';
  }

  /** Render trang kết quả cuối cùng dựa trên travelerProfile đã tính toán. */
  function renderResult(profile, classification) {
    const { resultType, primaryKey, secondaryKey, percents } = classification;

    let icon, nameVI, nameEN, description;

    if (resultType === 'single') {
      const type = PERSONALITY_TYPES[primaryKey];
      icon = type.icon;
      nameVI = type.nameVI;
      nameEN = type.nameEN;
      description = type.description;
    } else if (resultType === 'blend') {
      const primary = PERSONALITY_TYPES[primaryKey];
      const secondary = PERSONALITY_TYPES[secondaryKey];
      icon = primary.icon;
      nameVI = primary.nameVI + ' thiên hướng ' + secondary.nameVI;
      nameEN = primary.nameEN + ' thiên ' + secondary.nameEN;
      description =
        'Bạn là sự pha trộn giữa hai phong cách: bạn ' +
        primary.essence +
        ', nhưng đồng thời cũng ' +
        secondary.essence +
        '. Chính sự kết hợp này khiến hành trình của bạn trở nên khó đoán và thú vị hơn — không hoàn toàn thuộc về một khuôn mẫu nào. Kazei sẽ thiết kế một hành trình cân bằng giữa hai chất trong con người bạn, đủ để vừa thoả mãn phần ' +
        primary.nameVI.toLowerCase() +
        ', vừa nuôi dưỡng phần ' +
        secondary.nameVI.toLowerCase() +
        ' bên trong bạn.';
    } else {
      icon = TRAVELER_BLEND.icon;
      nameVI = TRAVELER_BLEND.nameVI;
      nameEN = TRAVELER_BLEND.nameEN;
      description = TRAVELER_BLEND.description;
    }

    dom.resultCard.innerHTML =
      '<p class="result-greeting">Xin chào, ' + escapeHTML(profile.name) + '.</p>' +
      '<div class="result-badge">' +
        '<span class="result-icon">' + icon + '</span>' +
        '<h2 class="result-name-vi">' + escapeHTML(nameVI) + '</h2>' +
        '<p class="result-name-en">' + escapeHTML(nameEN) + '</p>' +
      '</div>' +
      '<p class="result-description">' + escapeHTML(description) + '</p>' +
      '<div class="result-bars">' +
        buildBarRow('Explorer', percents.explorer) +
        buildBarRow('Reflector', percents.reflector) +
        buildBarRow('Creator', percents.creator) +
      '</div>';

    // Animate progress bar sau khi DOM đã được chèn.
    requestAnimationFrame(() => {
      dom.resultCard.querySelectorAll('.bar-fill').forEach((el) => {
        el.style.width = el.dataset.target + '%';
      });
    });
  }

  /** Helper: build 1 dòng progress bar cho phần trăm 1 nhóm tính cách. */
  function buildBarRow(label, percent) {
    return (
      '<div class="bar-row">' +
        '<div class="bar-row__meta"><span>' + label + '</span><span>' + percent + '%</span></div>' +
        '<div class="bar-track"><div class="bar-fill" data-target="' + percent + '" style="width:0%"></div></div>' +
      '</div>'
    );
  }

  /** Escape HTML cơ bản để tránh injection khi chèn tên người dùng vào DOM. */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==========================================================================
     5. EVENT LAYER
  ========================================================================== */

  /** Bật/tắt nút "Bắt đầu" tuỳ theo input tên có nội dung hay không. */
  dom.nameInput.addEventListener('input', () => {
    const value = dom.nameInput.value.trim();
    dom.btnStart.disabled = value.length === 0;
  });

  dom.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !dom.btnStart.disabled) {
      dom.btnStart.click();
    }
  });

  dom.btnStart.addEventListener('click', () => {
    const value = dom.nameInput.value.trim();
    if (!value) return; // Bảo vệ thêm: không cho bắt đầu nếu chưa nhập tên.
    state.userName = value;
    state.currentStep = 0;
    showScreen('quiz');
    renderStep();
  });

  dom.btnPrev.addEventListener('click', () => {
    if (state.currentStep === 0) return;
    state.currentStep -= 1;
    renderStep();
  });

  dom.btnNext.addEventListener('click', () => {
    const step = STEPS[state.currentStep];
    if (!isStepAnswered(step)) return; // Bảo vệ thêm: chặn Next nếu chưa chọn đáp án.

    if (state.currentStep < TOTAL_STEPS - 1) {
      state.currentStep += 1;
      renderStep();
    } else {
      finishQuiz();
    }
  });

  dom.btnRetake.addEventListener('click', () => {
    state.userName = '';
    state.currentStep = 0;
    state.answers = {};
    state.scores = { explorer: 0, reflector: 0, creator: 0 };
    dom.nameInput.value = '';
    dom.btnStart.disabled = true;
    showScreen('intro');
  });

  dom.btnDownload.addEventListener('click', () => {
    if (typeof html2canvas === 'undefined') {
      alert('Không thể tải ảnh lúc này. Vui lòng thử lại sau.');
      return;
    }
    dom.btnDownload.disabled = true;
    dom.btnDownload.textContent = 'Đang tạo ảnh...';

    html2canvas(dom.resultCard, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    })
      .then((canvas) => {
        const link = document.createElement('a');
        link.download = 'kazei-travel-personality.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      })
      .catch(() => {
        alert('Đã có lỗi khi tạo ảnh kết quả. Vui lòng thử lại.');
      })
      .finally(() => {
        dom.btnDownload.disabled = false;
        dom.btnDownload.textContent = 'Tải kết quả';
      });
  });

  /* ==========================================================================
     6. INIT
  ========================================================================== */

  /** Hoàn tất quiz: tính điểm, phân loại, build profile, lưu trữ, hiển thị kết quả. */
   async function finishQuiz() {
    recalculateScores();
    const classification = classifyPersonality(state.scores);
    const travelerProfile = buildTravelerProfile(classification);

    // STORAGE LUCAS THAY.
    // Sau này khi có backend, đây là điểm để thay bằng lệnh gọi API (fetch/POST).
    console.log('travelerProfile:', travelerProfile);
    await submitTravelerProfile(travelerProfile);




    renderResult(travelerProfile, classification);
    showScreen('result');
  }


  /* ==========================================================================
     FUNCTION LUCAS THÊM
  ========================================================================== */
  async function submitTravelerProfile(profile) {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    const result = await response.json();

    console.log("Google Sheet:", result);
    } catch (err) {
    console.error("Không thể gửi dữ liệu lên Google Sheet:", err);
    }
  }



  function init() {
    dom.btnStart.disabled = true;
    showScreen('intro');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
