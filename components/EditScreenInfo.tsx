import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export const EditScreenInfo = ({ path }: { path: string }) => {
  const title = 'Open up the code for this screen:';
  const description =
    'Change any of the text, save the file, and your app will automatically update.';

  return (
    <View>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText}>{title}</Text>
        <View style={[styles.codeHighlightContainer, styles.homeScreenFilename]}>
          <Text>{path}</Text>
        </View>
        <Text style={styles.getStartedText}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  codeHighlightContainer: { borderRadius: 6, paddingHorizontal: 4 },
  getStartedContainer: { alignItems: 'center', marginHorizontal: 12 },
  getStartedText: { fontSize: 18, lineHeight: 24, textAlign: 'center' },
  helpContainer: { alignItems: 'center', marginHorizontal: 5, marginTop: 16 },
  helpLink: { paddingVertical: 16 },
  helpLinkText: { textAlign: 'center' },
  homeScreenFilename: { marginVertical: 8 },
});
