import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <View style={{ marginLeft: 3 }}>
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Path
          d="M20 2L24.5 6.5H31L34 12.5L39 17L36.5 23L39 29L34 33.5L31 39.5H24.5L20 44L15.5 39.5H9L6 33.5L1 29L3.5 23L1 17L6 12.5L9 6.5H15.5L20 2Z"
          fill="#3897f0"
        />
        <Path
          d="M13 20.5L18 25.5L28 15"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}