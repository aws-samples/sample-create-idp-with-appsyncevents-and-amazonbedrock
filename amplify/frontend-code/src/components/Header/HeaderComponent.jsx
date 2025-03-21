import { useTheme, Grid, Image, View } from "@aws-amplify/ui-react";
import awsLogo from "./aws-logo.png";
import { useState } from "react";

const HeaderComponent = () => {
  const { tokens } = useTheme();
  const [awsLogoState] = useState(awsLogo);

  return (
    <Grid
      templateColumns="1fr 2fr 2fr 1fr"
      templateRows="4rem"
      backgroundColor={tokens.colors.purple[20]}
      alignItems="center"
      margin="auto auto auto"
    >
      <Image
        columnSpan={1}
        rowSpan={1}
        alt="Logo image"
        src={awsLogoState}
        objectFit="initial"
        objectPosition="50% 50%"
        backgroundColor={tokens.colors.purple[20]}
        height="80%"
        width="60%"
        opacity="100%"
        margin="auto auto auto"
      />
      <View columnSpan={3} rowSpan={1} />
    </Grid>
  );
};
export default HeaderComponent;
