/**
 * 남은양 카드 디자인 설정
 *
 * 이 파일의 값들을 수정하면 ItemDetailScreen의 남은양 카드 디자인이 변경됩니다.
 * Figma에서 디자인 수정 후 여기 값만 업데이트하세요!
 */

export const RemainsCardDesign = {
  /**
   * 카드 컨테이너
   */
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2, // Android
  },

  /**
   * 헤더 (남은양 라벨 + 업데이트 버튼)
   */
  header: {
    marginBottom: 8, // 헤더와 퍼센트 사이 간격
  },

  /**
   * 헤더 텍스트 ("남은양")
   */
  headerText: {
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
    color: '#616161',
  },

  /**
   * 퍼센트 표시
   */
  percentage: {
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    color: {
      normal: '#26A69A',   // 일반 상태
      frozen: '#4A90E2',   // 냉동 상태
    },
    marginBottom: 8, // 퍼센트와 슬라이더 사이 간격
  },

  /**
   * 업데이트 버튼
   */
  updateButton: {
    minWidth: 80,
    height: 36,
    borderRadius: 18, // Pill shape (높이의 절반)

    // 기본 상태 (비활성)
    default: {
      borderColor: '#E0E0E0',
      borderWidth: 1,
      backgroundColor: 'transparent',
      textColor: '#616161',
    },

    // 활성 상태 (값 변경 시)
    active: {
      borderColor: '#26A69A',
      borderWidth: 1,
      backgroundColor: '#26A69A',
      textColor: '#FFFFFF',
    },

    // 텍스트
    label: {
      fontSize: 12,
      fontFamily: 'OpenSans-SemiBold',
    },

    // 내부 패딩
    contentPadding: {
      horizontal: 16,
      vertical: 0,
    },
  },

  /**
   * 슬라이더 설정
   */
  slider: {
    // 컨테이너
    container: {
      paddingHorizontal: 12,
      paddingVertical: 16,
    },

    // 트랙 배경
    track: {
      height: 10,
      backgroundColor: '#E8F5F2',
      borderRadius: 5,
    },

    // 활성 트랙 (채워진 부분)
    activeTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: {
        normal: '#26A69A',   // 일반 상태
        frozen: '#4A90E2',   // 냉동 상태
      },
    },

    // Thumb (슬라이더 핸들)
    thumb: {
      width: 16,
      height: 32,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: {
        normal: '#26A69A',   // 일반 상태
        frozen: '#4A90E2',   // 냉동 상태
      },
      // 그림자
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3, // Android
    },

    // Thumb 컨테이너
    thumbContainer: {
      size: 40, // 터치 영역 크기
    },

    // 최대값 인디케이터 (빨간 선)
    maxLimitIndicator: {
      width: 2,
      height: 14,
      backgroundColor: '#F44336',
      topOffset: -2,
    },

    // 슬라이더 스텝 (증감 단위)
    step: 5, // 5% 단위
  },
} as const;

/**
 * 사용 예시:
 *
 * import { RemainsCardDesign } from '../constants/remainsCardDesign';
 *
 * const styles = StyleSheet.create({
 *   remainsCard: {
 *     ...RemainsCardDesign.card,
 *   },
 *   percentText: {
 *     ...RemainsCardDesign.percentage,
 *     color: isFrozen
 *       ? RemainsCardDesign.percentage.color.frozen
 *       : RemainsCardDesign.percentage.color.normal,
 *   },
 * });
 */

/**
 * Figma에서 값 변경 후 적용 가이드:
 *
 * 1. 카드 둥근 모서리 변경:
 *    - Figma: Corner radius 수정 (예: 12 → 16)
 *    - 코드: card.borderRadius = 16
 *
 * 2. 슬라이더 트랙 높이 변경:
 *    - Figma: Track Height 수정 (예: 10 → 12)
 *    - 코드: slider.track.height = 12
 *    - 코드: slider.activeTrack.height = 12
 *
 * 3. Thumb 크기 변경:
 *    - Figma: Thumb W×H 수정 (예: 16×32 → 20×36)
 *    - 코드: slider.thumb.width = 20
 *    - 코드: slider.thumb.height = 36
 *    - 코드: slider.thumb.borderRadius = 10 (width의 절반)
 *
 * 4. 색상 변경:
 *    - Figma: Fill 색상 변경 (예: #26A69A → #00BFA5)
 *    - 코드: 해당 색상 값 수정
 *
 * 5. 간격 조정:
 *    - Figma: Alt/Option 눌러 거리 측정
 *    - 코드: margin/padding 값 수정
 */
